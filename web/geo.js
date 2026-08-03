"use strict";
// Geolocation: the walking-companion layer. You-are-here dot, implicit walking
// mode (activates silently when permission is already granted and you're in
// Sydney), a "Near me" list with distance + direction, tap-to-guide with a live
// banner and arrival auto-open, and proximity-triggered tour stops.
// Loaded after app.js; reuses its globals (map, featureIndex, metersBetween,
// featureCenter, openFeature, openDetail, closeStory, allTours, activeTour,
// tourIndex, showTourStop, startTour, mqMobile, setSheet, EMPTY_FC, absorbedIds).
(function () {
  let userPos = null;            // [lng, lat]
  let tracking = false;          // GeolocateControl is actively watching
  let lastAutoStop = -1;         // avoid re-triggering the same proximity stop
  let guideKey = null;           // "type:id" currently being guided to
  let listPos = null;            // userPos when the near list was last rendered
  const TOUR_TRIGGER_M = 35;     // how close counts as "arrived" at a tour stop
  const ARRIVE_M = 30;           // how close counts as "arrived" when guiding
  const SYDNEY = [150.3, -34.35, 151.75, -33.3]; // generous greater-Sydney box
  const MODE_KEY = "walk-mode";  // localStorage: "auto" (default) | "off"
  const mode = () => localStorage.getItem(MODE_KEY) || "auto";

  const geo = new maplibregl.GeolocateControl({
    positionOptions: { enableHighAccuracy: true },
    trackUserLocation: true,
    showUserLocation: true,
    showAccuracyCircle: true,
  });
  map.addControl(geo, "top-right"); // control button is CSS-hidden; we drive it
  geo.on("trackuserlocationstart", () => { tracking = true; });
  geo.on("trackuserlocationend", () => { tracking = false; });
  geo.on("geolocate", (e) => {
    userPos = [e.coords.longitude, e.coords.latitude];
    onPosition();
  });
  geo.on("error", () => toastGeo("Couldn't get your location. Check location permission."));

  const inSydney = () =>
    userPos && userPos[0] > SYDNEY[0] && userPos[0] < SYDNEY[2] &&
    userPos[1] > SYDNEY[1] && userPos[1] < SYDNEY[3];

  const coordsOf = (f) => (typeof featureCenter === "function" ? featureCenter(f) : f.geometry.coordinates);
  const fmt = (m) => (m < 950 ? Math.round(m / 5) * 5 + " m" : (m / 1000).toFixed(1) + " km");
  const TYPE_LABEL = { story: "Story", building: "Building", person: "Person", street: "Street" };

  function bearingTo(a, b) {
    const toR = Math.PI / 180;
    const dLng = (b[0] - a[0]) * toR, la1 = a[1] * toR, la2 = b[1] * toR;
    const y = Math.sin(dLng) * Math.cos(la2);
    const x = Math.cos(la1) * Math.sin(la2) - Math.sin(la1) * Math.cos(la2) * Math.cos(dLng);
    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  }
  const arrow = (deg) => `<span class="near-a" style="transform:rotate(${Math.round(deg)}deg)">↑</span>`;

  // --- "Near me" button ---
  const btn = document.createElement("button");
  btn.id = "nearme-btn";
  btn.type = "button";
  btn.innerHTML = "◎ Near me";
  document.body.appendChild(btn);
  btn.addEventListener("click", () => {
    if (userPos) { if (!tracking) geo.trigger(); showNearby(); return; }
    geo.trigger();
    btn.classList.add("locating");
    const once = () => { btn.classList.remove("locating"); geo.off("geolocate", once); showNearby(); };
    geo.on("geolocate", once);
  });

  // --- Implicit walking mode: if permission is already granted (and not
  // manually switched off), start locating silently; the button then shows a
  // live count of what's within reach. First-time users still tap to opt in.
  if (navigator.permissions && navigator.permissions.query) {
    navigator.permissions.query({ name: "geolocation" }).then((st) => {
      if (st.state === "granted" && mode() !== "off") {
        const go = () => geo.trigger();
        map.loaded() ? go() : map.once("idle", go);
      }
    }).catch(() => {});
  }

  // --- Manual override: a toggle beside the labels toggle in the sidebar ---
  function applyMode() {
    btn.style.display = mode() === "off" ? "none" : "";
    if (mode() === "off") clearGuide();
  }
  const labels = document.getElementById("labels-toggle");
  if (labels) {
    const toggle = document.createElement("label");
    toggle.className = "toggle";
    toggle.innerHTML = `<input type="checkbox" id="walk-toggle" ${mode() !== "off" ? "checked" : ""} /> Walking mode (Near me, arrival alerts)`;
    labels.closest("label").insertAdjacentElement("afterend", toggle);
    toggle.querySelector("input").addEventListener("change", (e) => {
      localStorage.setItem(MODE_KEY, e.target.checked ? "auto" : "off");
      applyMode();
    });
  }
  applyMode();

  function nearest(n, maxM) {
    const absorbed = (typeof absorbedIds !== "undefined") ? absorbedIds : new Set();
    const out = [];
    for (const key in featureIndex) {
      const f = featureIndex[key];
      if (!f || !f.geometry) continue;
      if (absorbed.has(key.split(":")[1])) continue; // pins folded into a deep dive
      const d = metersBetween(userPos, coordsOf(f));
      if (maxM && d > maxM) continue;
      out.push({ key, f, d });
    }
    out.sort((a, b) => a.d - b.d);
    return n ? out.slice(0, n) : out;
  }
  function nearestTours(maxM) {
    if (typeof allTours === "undefined") return [];
    const res = [];
    for (const t of allTours) {
      let best = Infinity;
      for (const s of t.stops) {
        const f = featureIndex[s.ref];
        if (f && f.geometry) best = Math.min(best, metersBetween(userPos, coordsOf(f)));
      }
      if (best < maxM) res.push({ t, d: best });
    }
    res.sort((a, b) => a.d - b.d);
    return res.slice(0, 4);
  }

  function showNearby() {
    if (!userPos) return;
    listPos = userPos;
    if (!inSydney()) {
      openDetail(`<h3>Near you</h3>
        <p>You're outside the map's Sydney coverage, so there's nothing within walking distance. Explore the map freely, or come back to this when you're in town.</p>`);
      if (typeof mqMobile !== "undefined" && mqMobile.matches && typeof setSheet === "function") setSheet(true);
      return;
    }
    const items = nearest(14);
    const tours = nearestTours(2500);
    const list = items.map(({ key, f, d }) => {
      const p = f.properties, name = p.name || p.title || p.id, type = key.split(":")[0];
      return `<li class="near-item" data-key="${key}">
        <span class="near-d">${arrow(bearingTo(userPos, coordsOf(f)))}${fmt(d)}</span>
        <span class="near-nm">${name}</span><span class="near-ty">${TYPE_LABEL[type] || type}</span></li>`;
    }).join("");
    const tourHtml = tours.length
      ? `<h4 class="near-h">Tours near you</h4><ul class="near-list">${tours.map(({ t, d }) =>
          `<li class="near-item near-tour" data-tour="${t.id}"><span class="near-d">${fmt(d)}</span><span class="near-nm">${t.title}</span><span class="near-ty">Tour ›</span></li>`).join("")}</ul>`
      : "";
    openDetail(`<h3>Near you</h3>
      <p class="hint">Closest places, people and stories. Tap one and we'll point you to it.</p>
      <button class="near-gen" type="button">✦ Build a walking tour from here</button>
      <div class="gen-form" hidden>
        <div class="gen-q">What are you interested in?</div>
        <div class="chips gen-themes">
          <button type="button" class="gt-any active">Surprise me</button>
          ${THEMES.map((t) => `<button type="button" data-theme="${t}">${t}</button>`).join("")}
        </div>
        <div class="gen-q">How long have you got?</div>
        <div class="chips gen-time">
          <button type="button" data-mins="30">30 min</button>
          <button type="button" data-mins="60" class="active">1 hour</button>
          <button type="button" data-mins="120">2 hours</button>
        </div>
        <button class="gen-go" type="button">Create my walk</button>
      </div>
      ${tourHtml}
      <h4 class="near-h">Places near you</h4>
      <ul class="near-list">${list}</ul>`);
    wireGenForm();
    storyDetail.querySelectorAll(".near-item[data-key]").forEach((el) =>
      el.addEventListener("click", () => guideTo(el.dataset.key)));
    storyDetail.querySelectorAll(".near-item[data-tour]").forEach((el) =>
      el.addEventListener("click", () => { const t = allTours.find((x) => x.id === el.dataset.tour); if (t) startTour(t); }));
    if (typeof mqMobile !== "undefined" && mqMobile.matches && typeof setSheet === "function") setSheet(true);
  }

  // --- The walk composer: interests + time budget → a generated tour ---
  // Budgets are straight-line metres; the router turns them into real paths.
  const GEN_BUDGETS = { 30: { budgetM: 1100, maxStops: 5, radiusM: 800 },
                        60: { budgetM: 2300, maxStops: 9, radiusM: 1400 },
                        120: { budgetM: 4300, maxStops: 13, radiusM: 2200 } };
  function wireGenForm() {
    const btn = storyDetail.querySelector(".near-gen");
    const form = storyDetail.querySelector(".gen-form");
    if (!btn || !form) return;
    btn.addEventListener("click", () => { form.hidden = !form.hidden; updateCount(); });
    const themeBtns = [...form.querySelectorAll(".gen-themes button[data-theme]")];
    const anyBtn = form.querySelector(".gt-any");
    const timeBtns = [...form.querySelectorAll(".gen-time button")];
    const go = form.querySelector(".gen-go");
    const picked = () => themeBtns.filter((b) => b.classList.contains("active")).map((b) => b.dataset.theme);
    const mins = () => +timeBtns.find((b) => b.classList.contains("active")).dataset.mins;
    function updateCount() {
      const opts = GEN_BUDGETS[mins()];
      const themes = picked();
      let n = 0;
      for (const key in featureIndex) {
        const f = featureIndex[key];
        if (!f.geometry || f.geometry.type !== "Point") continue;
        if (absorbedIds.has(key.split(":")[1])) continue;
        const p = f.properties;
        const ts = Array.isArray(p.theme) ? p.theme : p.theme ? [p.theme] : [];
        if (themes.length && !themes.some((w) => ts.includes(w))) continue;
        if (metersBetween(userPos, coordsOf(f)) <= opts.radiusM) n++;
      }
      go.textContent = n >= 3 ? `Create my walk (${n} places in range)` : "Not enough places for that mix";
      go.disabled = n < 3;
    }
    anyBtn.addEventListener("click", () => {
      themeBtns.forEach((b) => b.classList.remove("active"));
      anyBtn.classList.add("active");
      updateCount();
    });
    themeBtns.forEach((b) => b.addEventListener("click", () => {
      b.classList.toggle("active");
      anyBtn.classList.toggle("active", !themeBtns.some((x) => x.classList.contains("active")));
      updateCount();
    }));
    timeBtns.forEach((b) => b.addEventListener("click", () => {
      timeBtns.forEach((x) => x.classList.toggle("active", x === b));
      updateCount();
    }));
    go.addEventListener("click", async () => {
      go.disabled = true;
      go.textContent = "Plotting your route…";
      const opts = { start: userPos, themes: picked(), ...GEN_BUDGETS[mins()] };
      // the intro bar's ↻ re-rolls with the same answers from a fresh position
      window.regenWalkingTour = async () => {
        const again = await buildDynamicTour(null, null, { ...opts, start: userPos || opts.start });
        if (again) startTour(again); else toastGeo("Couldn't find another route with that mix.");
      };
      const t = await buildDynamicTour(null, null, opts);
      if (t) startTour(t);
      else { toastGeo("Not enough places within walking range here."); updateCount(); }
    });
    updateCount();
  }

  // Refresh the open near list as you walk (only when it's actually visible).
  function refreshNearby() {
    if (!listPos || storyDetail.hidden || !storyDetail.querySelector(".near-list")) return;
    if (metersBetween(userPos, listPos) < 10) return;
    showNearby();
  }

  // --- Guide mode: a dashed line + live banner pointing to one feature ---
  function ensureGuideLayer() {
    if (map.getSource("guide-line")) return;
    map.addSource("guide-line", { type: "geojson", data: EMPTY_FC });
    map.addLayer({
      id: "guide-line", type: "line", source: "guide-line",
      layout: { "line-cap": "round" },
      paint: { "line-color": "#2a6f6b", "line-width": 3, "line-dasharray": [0.4, 2] },
    });
  }
  let bannerEl = null;
  function ensureBanner() {
    if (bannerEl) return;
    bannerEl = document.createElement("div");
    bannerEl.id = "guide-banner";
    bannerEl.innerHTML = `<button class="gb-txt" type="button"></button><button class="gb-x" aria-label="Stop guiding">✕</button>`;
    document.body.appendChild(bannerEl);
    bannerEl.querySelector(".gb-txt").addEventListener("click", () => { if (guideKey) { const k = guideKey; clearGuide(); openFeature(k); } });
    bannerEl.querySelector(".gb-x").addEventListener("click", clearGuide);
  }
  function guideTo(key) {
    const f = featureIndex[key];
    if (!f || !userPos) return;
    // Outside walking range (or outside Sydney), just open it — explore behaviour.
    if (!inSydney() || metersBetween(userPos, coordsOf(f)) > 3000) { openFeature(key); return; }
    guideKey = key;
    ensureGuideLayer();
    ensureBanner();
    closeStory(); // lower the sheet so the route is visible
    updateGuide();
    bannerEl.classList.add("show");
    // Build bounds by extending from a point — a raw [a, b] pair is read as
    // [sw, ne] and wraps the globe whenever a sits east of b.
    const bnds = new maplibregl.LngLatBounds(userPos, userPos).extend(coordsOf(f));
    map.fitBounds(bnds, { padding: 90, maxZoom: 17, duration: 700 });
  }
  function clearGuide() {
    guideKey = null;
    if (map.getSource("guide-line")) map.getSource("guide-line").setData(EMPTY_FC);
    if (bannerEl) bannerEl.classList.remove("show");
  }
  function updateGuide() {
    if (!guideKey || !userPos) return;
    const f = featureIndex[guideKey];
    const c = coordsOf(f);
    map.getSource("guide-line").setData({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [userPos, c] } });
    const d = metersBetween(userPos, c);
    const p = f.properties;
    bannerEl.querySelector(".gb-txt").innerHTML = `${arrow(bearingTo(userPos, c))} ${fmt(d)} · ${p.name || p.title}`;
    if (d <= ARRIVE_M) {
      const k = guideKey;
      clearGuide();
      toastGeo("You've arrived");
      openFeature(k); // opens the card; deep-dive pins offer their chapter library
    }
  }

  // --- Every position fix: guide, near-list refresh, button count, tour stops ---
  function onPosition() {
    updateGuide();
    refreshNearby();
    // Idle affordance: the button quietly advertises what's within reach.
    if (mode() !== "off" && inSydney()) {
      const n = nearest(null, 400).length;
      btn.innerHTML = n ? `◎ ${n} near you` : "◎ Near me";
    }
    // proximity-triggered tour stops
    if (typeof activeTour === "undefined" || !activeTour || !activeTour.stops) { lastAutoStop = -1; return; }
    let best = -1, bestd = Infinity;
    activeTour.stops.forEach((s, i) => {
      const f = featureIndex[s.ref];
      if (!f || !f.geometry) return;
      const dd = metersBetween(userPos, coordsOf(f));
      if (dd < bestd) { bestd = dd; best = i; }
    });
    if (best >= 0 && bestd <= TOUR_TRIGGER_M && best !== tourIndex && best !== lastAutoStop) {
      lastAutoStop = best;
      if (typeof clearTourTimer === "function") clearTourTimer();
      showTourStop(best);
      toastGeo(`You've reached stop ${best + 1}`);
    }
  }

  function toastGeo(msg) {
    let t = document.getElementById("geo-toast");
    if (!t) { t = document.createElement("div"); t.id = "geo-toast"; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toastGeo._t); toastGeo._t = setTimeout(() => t.classList.remove("show"), 3000);
  }
})();

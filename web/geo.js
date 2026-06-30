"use strict";
// Geolocation: you-are-here dot, "Near me" nearby list, and proximity-triggered tour stops.
// Loaded after app.js; reuses its globals (map, featureIndex, metersBetween, featureCenter,
// openFeature, openDetail, allTours, activeTour, tourIndex, showTourStop, startTour, mqMobile).
(function () {
  let userPos = null;            // [lng, lat]
  let lastAutoStop = -1;         // avoid re-triggering the same proximity stop
  const TOUR_TRIGGER_M = 35;     // how close counts as "arrived" at a stop

  const geo = new maplibregl.GeolocateControl({
    positionOptions: { enableHighAccuracy: true },
    trackUserLocation: true,
    showUserLocation: true,
    showAccuracyCircle: true,
  });
  map.addControl(geo, "top-right");
  geo.on("geolocate", (e) => {
    userPos = [e.coords.longitude, e.coords.latitude];
    onPosition();
  });
  geo.on("error", () => toastGeo("Couldn't get your location. Check location permission."));

  const coordsOf = (f) => (typeof featureCenter === "function" ? featureCenter(f) : f.geometry.coordinates);
  const fmt = (m) => (m < 950 ? Math.round(m / 5) * 5 + " m" : (m / 1000).toFixed(1) + " km");
  const TYPE_LABEL = { story: "Story", building: "Building", person: "Person", street: "Street" };

  // --- "Near me" button ---
  const btn = document.createElement("button");
  btn.id = "nearme-btn";
  btn.type = "button";
  btn.innerHTML = "◎ Near me";
  document.body.appendChild(btn);
  btn.addEventListener("click", () => {
    geo.trigger(); // ask for / centre on location
    if (userPos) return showNearby();
    btn.classList.add("locating");
    const once = () => { btn.classList.remove("locating"); geo.off("geolocate", once); showNearby(); };
    geo.on("geolocate", once);
  });

  function nearest(n) {
    const absorbed = (typeof absorbedIds !== "undefined") ? absorbedIds : new Set();
    const out = [];
    for (const key in featureIndex) {
      const f = featureIndex[key];
      if (!f || !f.geometry) continue;
      if (absorbed.has(key.split(":")[1])) continue; // skip pins folded into a deep dive
      out.push({ key, f, d: metersBetween(userPos, coordsOf(f)) });
    }
    out.sort((a, b) => a.d - b.d);
    return out.slice(0, n);
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
    const items = nearest(14);
    const tours = nearestTours(2500);
    const list = items.map(({ key, f, d }) => {
      const p = f.properties, name = p.name || p.title || p.id, type = key.split(":")[0];
      return `<li class="near-item" data-key="${key}"><span class="near-d">${fmt(d)}</span><span class="near-nm">${name}</span><span class="near-ty">${TYPE_LABEL[type] || type}</span></li>`;
    }).join("");
    const tourHtml = tours.length
      ? `<h4 class="near-h">Tours near you</h4><ul class="near-list">${tours.map(({ t, d }) =>
          `<li class="near-item near-tour" data-tour="${t.id}"><span class="near-d">${fmt(d)}</span><span class="near-nm">${t.title}</span><span class="near-ty">Tour ›</span></li>`).join("")}</ul>`
      : "";
    openDetail(`<h3>Near you</h3>
      <p class="hint">Closest places, people and stories to where you are now. Tap to open.</p>
      ${tourHtml}
      <h4 class="near-h">Places near you</h4>
      <ul class="near-list">${list}</ul>`);
    storyDetail.querySelectorAll(".near-item[data-key]").forEach((el) =>
      el.addEventListener("click", () => openFeature(el.dataset.key)));
    storyDetail.querySelectorAll(".near-item[data-tour]").forEach((el) =>
      el.addEventListener("click", () => { const t = allTours.find((x) => x.id === el.dataset.tour); if (t) startTour(t); }));
    if (typeof mqMobile !== "undefined" && mqMobile.matches && typeof setSheet === "function") setSheet(true);
  }

  // --- proximity-triggered tour stops ---
  function onPosition() {
    if (typeof activeTour === "undefined" || !activeTour || !activeTour.stops) { lastAutoStop = -1; return; }
    let best = -1, bestd = Infinity;
    activeTour.stops.forEach((s, i) => {
      const f = featureIndex[s.ref];
      if (!f || !f.geometry) return;
      const dd = metersBetween(userPos, coordsOf(f));
      if (dd < bestd) { bestd = dd; best = i; }
    });
    // Arrived at a stop that isn't the one already showing -> open it.
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

"use strict";
// ============================================================================
// Tour builder — the map-backed "Tours" tab. Create tours, choose pins (stops)
// and their order, and draw the tracks between them (auto-route + hand-edit).
// Self-contained: loads tours.json + the pin geojsons, saves via /api/save.
// Exposes window.TourBuilder = { open }.
// ============================================================================
(function () {
  const OSRM = "https://routing.openstreetmap.de/routed-foot/route/v1/foot/";
  const $ = (s, r = document) => r.querySelector(s);
  const el = (t, p = {}, kids = []) => {
    const n = document.createElement(t);
    for (const k in p) {
      if (k === "class") n.className = p[k];
      else if (k === "html") n.innerHTML = p[k];
      else if (k.startsWith("on")) n.addEventListener(k.slice(2), p[k]);
      else if (p[k] != null) n.setAttribute(k, p[k]);
    }
    for (const c of [].concat(kids)) if (c != null) n.append(c.nodeType ? c : document.createTextNode(c));
    return n;
  };
  const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "tour";

  let tours = [], feats = {}, featList = [], dossiersByAnchor = {};
  let cur = null, selLeg = -1, selStop = -1, loaded = false;
  let map, stopMarkers = [], wpMarkers = [], dirty = false;
  const asArr = (v) => Array.isArray(v) ? v : (v == null || v === "" ? [] : [v]);

  // ---- geometry helpers ----------------------------------------------------
  const R = 6371000, rad = (d) => d * Math.PI / 180;
  function metres(a, b) {
    const dLa = rad(b[1] - a[1]), dLo = rad(b[0] - a[0]);
    const h = Math.sin(dLa / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLo / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  const lineLen = (cs) => { let d = 0; for (let i = 1; i < cs.length; i++) d += metres(cs[i - 1], cs[i]); return d; };
  const stopCoord = (i) => { const f = feats[cur.stops[i].ref]; return f ? f.coords : null; };

  let geoData = {};              // type -> { file, gj } — the raw feature collections
  const geoDirty = new Set();    // types whose geojson has unsaved edits
  // the narrative field varies by type; use it when editing pin body
  const BODY_FIELD = { story: "body", person: "body", building: "stories", street: "timeline" };

  // ---- undo / redo ----------------------------------------------------------
  let undoStack = [], redoStack = [], geoInPlay = new Set(), lastKey = null, lastAt = 0, keyBound = false;

  // A live feats entry that reads through to the (mutable) raw feature.
  function makeFeatEntry(ty, f) {
    return {
      key: `${ty}:${f.properties.id}`, type: ty, feature: f,
      get name() { const p = f.properties; return p.name || p.title || p.id; },
      get coords() { const g = f.geometry; return g.type === "Point" ? g.coordinates : g.coordinates[0]; },
      get isPoint() { return f.geometry.type === "Point"; },
      get image() { const p = f.properties; return p.image || (Array.isArray(p.images) && p.images[0]) || ""; },
      get summary() { return f.properties.summary || ""; },
      get body() { return asArr(f.properties.body).concat(asArr(f.properties.stories)); },
      get papers() { return f.properties.papers || ""; },
    };
  }
  function rebuildFeats() {
    feats = {};
    for (const ty in geoData) for (const f of geoData[ty].gj.features) feats[`${ty}:${f.properties.id}`] = makeFeatEntry(ty, f);
    featList = Object.values(feats).sort((a, b) => a.name.localeCompare(b.name));
  }

  const clone = (o) => JSON.parse(JSON.stringify(o));
  function snap() {
    const geo = {};
    for (const ty of geoInPlay) geo[ty] = clone(geoData[ty].gj);
    return { tours: clone(tours), geo, curId: cur && cur.id, selLeg, selStop, geoDirty: [...geoDirty] };
  }
  // Capture the state BEFORE a change. `key` coalesces a rapid run of same-field
  // edits (typing) into a single undo step; pass no key for discrete actions.
  function pushUndo(key) {
    const now = Date.now();
    if (key && key === lastKey && now - lastAt < 800) { lastAt = now; return; }
    undoStack.push(snap());
    if (undoStack.length > 80) undoStack.shift();
    redoStack = [];
    lastKey = key || null; lastAt = now;
    updateUndoButtons();
  }
  function updateUndoButtons() {
    const u = document.getElementById("tb-undo"), r = document.getElementById("tb-redo");
    if (u) u.disabled = !undoStack.length;
    if (r) r.disabled = !redoStack.length;
  }
  function applySnap(s) {
    tours = s.tours;
    for (const ty in s.geo) geoData[ty].gj = s.geo[ty];
    rebuildFeats();
    cur = s.curId ? tours.find((t) => t.id === s.curId) : null;
    if (cur) { cur.stops = cur.stops || []; cur.tracks = cur.tracks || []; }
    selLeg = s.selLeg; selStop = s.selStop;
    geoDirty.clear(); s.geoDirty.forEach((x) => geoDirty.add(x));
    dirty = true; lastKey = null;
    const b = document.getElementById("tb-save"); if (b) b.disabled = false;
    if (map && map.getSource("tb-tracks")) { if (cur) drawTour(false); else { clearMarkers(); map.getSource("tb-tracks").setData(EMPTY); } }
    renderRail();
  }
  function undo() { if (!undoStack.length) { setStatus("nothing to undo"); return; } redoStack.push(snap()); applySnap(undoStack.pop()); setStatus("undone"); }
  function redo() { if (!redoStack.length) { setStatus("nothing to redo"); return; } undoStack.push(snap()); applySnap(redoStack.pop()); setStatus("redone"); }
  const builderActive = () => !!(document.body.dataset.standalone || (document.getElementById("tour-builder") && !document.getElementById("tour-builder").hidden));

  // ---- data ----------------------------------------------------------------
  async function loadData() {
    tours = await (await fetch("../data/tours.json?v=" + Date.now())).json();
    for (const [fn, ty] of [["stories", "story"], ["buildings", "building"], ["people", "person"], ["streets", "street"]]) {
      const gj = await (await fetch(`../data/${fn}.geojson?v=${Date.now()}`)).json();
      geoData[ty] = { file: `${fn}.geojson`, gj };
    }
    rebuildFeats(); // live feature index (also used after an undo restores geojson state)
    try {
      const dos = await (await fetch("../data/dossiers.json?v=" + Date.now())).json();
      for (const d of dos) dossiersByAnchor[d.anchor] = d;
    } catch (e) { /* seeding from deep-dives just won't be available */ }
    loaded = true;
  }

  // ---- map -----------------------------------------------------------------
  function rasterStyle() {
    return {
      version: 8,
      sources: { base: { type: "raster", tileSize: 256, attribution: "© CARTO © OpenStreetMap",
        tiles: ["https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"] } },
      layers: [{ id: "base", type: "raster", source: "base" }],
    };
  }
  function ensureMap() {
    if (map) { map.resize(); return; }
    map = new maplibregl.Map({ container: "tb-map", style: rasterStyle(), center: [151.21, -33.87], zoom: 12 });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.on("load", () => {
      map.addSource("tb-tracks", { type: "geojson", data: EMPTY });
      map.addLayer({ id: "tb-tracks", type: "line", source: "tb-tracks",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": ["case", ["get", "sel"], "#d4582a", "#5566aa"],
          "line-width": ["case", ["get", "sel"], 6, 3], "line-opacity": ["case", ["get", "sel"], 1, 0.7] } });
      map.addLayer({ id: "tb-tracks-hit", type: "line", source: "tb-tracks",
        paint: { "line-color": "#000", "line-opacity": 0.01, "line-width": 20 } });
      map.on("click", "tb-tracks-hit", onTrackClick);
      map.on("mousedown", "tb-tracks-hit", onTrackDown);
      map.on("mouseenter", "tb-tracks-hit", (e) => map.getCanvas().style.cursor = (e.features[0].properties.i === selLeg ? "grab" : "pointer"));
      map.on("mouseleave", "tb-tracks-hit", () => map.getCanvas().style.cursor = "");
      if (cur) drawTour(true);
    });
  }
  const EMPTY = { type: "FeatureCollection", features: [] };

  function clearMarkers() {
    stopMarkers.forEach((m) => m.remove()); stopMarkers = [];
    wpMarkers.forEach((m) => m.remove()); wpMarkers = [];
  }

  function drawTour(fit) {
    if (!map || !map.getSource("tb-tracks")) return; // sources not added yet — the load handler will redraw
    clearMarkers();
    if (!cur) { map.getSource("tb-tracks").setData(EMPTY); return; }
    // track lines
    const features = (cur.tracks || []).map((tr, i) => {
      const coords = (tr.coordinates && tr.coordinates.length >= 2)
        ? tr.coordinates : [stopCoord(i), stopCoord(i + 1)].filter(Boolean);
      return coords.length >= 2 ? { type: "Feature", properties: { i, sel: i === selLeg }, geometry: { type: "LineString", coordinates: coords } } : null;
    }).filter(Boolean);
    map.getSource("tb-tracks").setData({ type: "FeatureCollection", features });
    // numbered stop markers — draggable (Point pins) to reposition the pin itself
    cur.stops.forEach((s, i) => {
      const c = stopCoord(i); if (!c) return;
      const f = feats[s.ref];
      const drag = f && f.isPoint;
      const box = el("div", { class: "tb-stopmark" + (i === selStop ? " sel" : "") + (drag ? "" : " nodrag") }, String(i + 1));
      const m = new maplibregl.Marker({ element: box, anchor: "center", draggable: drag }).setLngLat(c).addTo(map);
      let moved = false;
      m.on("dragstart", () => { moved = false; });
      m.on("drag", () => { moved = true; });
      m.on("dragend", () => { moveFeature(s.ref, m.getLngLat().toArray()); });
      box.addEventListener("click", () => { if (!moved) selectStop(i); });
      stopMarkers.push(m);
    });
    // draggable waypoints for the selected leg
    if (selLeg >= 0 && cur.tracks[selLeg]) {
      const tr = cur.tracks[selLeg];
      (tr.waypoints || []).forEach((wp, wi) => {
        const dot = el("div", { class: "tb-wp", title: "Drag to reshape · double-click to remove" });
        const m = new maplibregl.Marker({ element: dot, draggable: true }).setLngLat(wp).addTo(map);
        m.on("dragstart", () => pushUndo());
        m.on("dragend", () => { tr.waypoints[wi] = m.getLngLat().toArray(); routeLeg(selLeg); });
        dot.addEventListener("dblclick", (e) => { e.stopPropagation(); pushUndo(); tr.waypoints.splice(wi, 1); routeLeg(selLeg); });
        wpMarkers.push(m);
      });
    }
    if (fit) fitTour();
  }

  function fitTour() {
    let b = null;
    for (const s of cur.stops) { const c = feats[s.ref] && feats[s.ref].coords; if (c) b = b ? b.extend(c) : new maplibregl.LngLatBounds(c, c); }
    if (b) map.fitBounds(b, { padding: 60, maxZoom: 16, duration: 500 });
  }

  // Reposition a stop's underlying pin (Point features only), save-marked, and
  // re-route the legs on either side so the route follows the pin.
  function moveFeature(ref, lngLat) {
    const f = feats[ref]; if (!f || !f.isPoint) return;
    geoInPlay.add(f.type); pushUndo();
    f.feature.geometry.coordinates = lngLat;
    geoDirty.add(f.type); markDirty();
    if (cur) cur.stops.forEach((s, i) => {
      if (s.ref !== ref) return;
      if (i - 1 >= 0 && i - 1 < cur.tracks.length) routeLeg(i - 1);
      if (i < cur.tracks.length) routeLeg(i);
    });
    drawTour(); renderRail();
  }

  // Where along [stopA, ...vias, stopB] a point cheapest-inserts (keeps order).
  function insertIndex(i, p) {
    const tr = cur.tracks[i];
    const pts = [stopCoord(i), ...(tr.waypoints || []), stopCoord(i + 1)];
    let best = 0, bestCost = Infinity;
    for (let k = 0; k < pts.length - 1; k++) {
      const cost = metres(pts[k], p) + metres(p, pts[k + 1]) - metres(pts[k], pts[k + 1]);
      if (cost < bestCost) { bestCost = cost; best = k; }
    }
    return best; // insert into waypoints at this index
  }

  // Click a track just SELECTS it. Reshaping is a grab-and-drag (mousedown below).
  function onTrackClick(e) {
    const i = e.features[0].properties.i;
    if (i !== selLeg) selectLeg(i);
  }

  // Grab the selected track's line and drag to reshape it — a via-point is
  // created under the cursor and follows it; the leg re-routes on release.
  function onTrackDown(e) {
    const i = e.features[0].properties.i;
    if (i !== selLeg) return;                 // only the selected leg reshapes
    e.preventDefault();
    pushUndo();
    const tr = cur.tracks[i];
    tr.waypoints = tr.waypoints || [];
    const p = [e.lngLat.lng, e.lngLat.lat];
    const at = insertIndex(i, p);
    tr.waypoints.splice(at, 0, p);
    map.dragPan.disable();
    map.getCanvas().style.cursor = "grabbing";
    const preview = () => map.getSource("tb-tracks").setData({ type: "FeatureCollection", features: (cur.tracks || []).map((t, k) => {
      const coords = k === i ? [stopCoord(i), ...t.waypoints, stopCoord(i + 1)] : ((t.coordinates && t.coordinates.length >= 2) ? t.coordinates : [stopCoord(k), stopCoord(k + 1)]);
      return { type: "Feature", properties: { i: k, sel: k === selLeg }, geometry: { type: "LineString", coordinates: coords } };
    }) });
    const move = (ev) => { tr.waypoints[at] = [ev.lngLat.lng, ev.lngLat.lat]; preview(); };
    const up = () => {
      map.off("mousemove", move);
      map.dragPan.enable(); map.getCanvas().style.cursor = "";
      routeLeg(i);
    };
    map.on("mousemove", move);
    map.once("mouseup", up);
  }

  // ---- routing -------------------------------------------------------------
  async function fetchRoute(points) {
    const locs = points.map((c) => `${c[0]},${c[1]}`).join(";");
    try {
      const r = await fetch(`${OSRM}${locs}?overview=full&geometries=geojson&steps=false`);
      if (!r.ok) throw new Error("HTTP " + r.status);
      const j = await r.json();
      return j.routes && j.routes[0] ? j.routes[0].geometry.coordinates : null;
    } catch (e) { console.warn("route failed", e); return null; }
  }
  async function routeLeg(i) {
    const tr = cur.tracks[i]; if (!tr) return;
    const a = stopCoord(i), b = stopCoord(i + 1); if (!a || !b) return;
    markDirty();
    if (tr.mode === "draw") {
      tr.coordinates = [a, ...(tr.waypoints || []), b];
      drawTour(); renderRail(); return;
    }
    setStatus("routing…");
    const cs = await fetchRoute([a, ...(tr.waypoints || []), b]);
    tr.coordinates = cs || [a, ...(tr.waypoints || []), b];
    setStatus("");
    drawTour(); renderRail();
  }

  // ---- stop editing --------------------------------------------------------
  function syncTracks() {
    cur.tracks = cur.tracks || [];
    // trim extras
    cur.tracks.length = Math.max(0, cur.stops.length - 1);
    for (let i = 0; i < cur.stops.length - 1; i++) {
      if (!cur.tracks[i]) cur.tracks[i] = { from: i, to: i + 1, mode: "route", coordinates: [], directions: "", narration: "", waypoints: [] };
      cur.tracks[i].from = i; cur.tracks[i].to = i + 1;
      cur.tracks[i].waypoints = cur.tracks[i].waypoints || [];
    }
  }
  async function addStop(key) {
    if (!feats[key]) return;
    pushUndo();
    cur.stops.push({ ref: key });
    syncTracks(); markDirty();
    const i = cur.stops.length - 2;      // the new leg, if any
    drawTour(true); renderRail();
    if (i >= 0) await routeLeg(i);        // auto-route the leg into the new stop
  }
  function removeStop(i) {
    pushUndo();
    cur.stops.splice(i, 1);
    syncTracks(); markDirty();
    selLeg = -1; selStop = -1; drawTour(true); renderRail();
    // re-route the leg that now bridges the gap
    if (i - 1 >= 0 && i - 1 < cur.tracks.length) routeLeg(i - 1);
  }
  function moveStop(i, dir) {
    const j = i + dir; if (j < 0 || j >= cur.stops.length) return;
    pushUndo();
    [cur.stops[i], cur.stops[j]] = [cur.stops[j], cur.stops[i]];
    syncTracks(); markDirty(); selLeg = -1; selStop = -1; drawTour(true); renderRail();
    // re-route the legs touching either moved position
    [i - 1, i, j - 1, j].filter((k, idx, a) => k >= 0 && k < cur.tracks.length && a.indexOf(k) === idx).forEach(routeLeg);
  }
  function selectLeg(i) {
    selLeg = (i >= 0 && i < (cur.tracks || []).length) ? i : -1;
    selStop = -1;
    drawTour(); renderRail();
  }
  function selectStop(i) {
    selStop = (i >= 0 && i < cur.stops.length) ? i : -1;
    selLeg = -1;
    drawTour(); renderRail();
  }

  // ---- rail (left panel) ---------------------------------------------------
  function renderRail() {
    const rail = $("#tb-rail"); rail.innerHTML = "";
    // header
    rail.append(el("div", { class: "tb-head" }, [
      el("button", { class: "tb-btn primary", onclick: newTour }, "+ New tour"),
      el("button", { class: "tb-btn", onclick: saveTours, id: "tb-save", disabled: dirty ? null : "" }, "Save"),
      el("button", { class: "tb-btn", id: "tb-undo", onclick: undo, title: "Undo (⌘Z)", disabled: undoStack.length ? null : "" }, "↶"),
      el("button", { class: "tb-btn", id: "tb-redo", onclick: redo, title: "Redo (⌘⇧Z)", disabled: redoStack.length ? null : "" }, "↷"),
    ]));
    if (!cur) {
      rail.append(el("div", { class: "tb-muted" }, "Pick a tour to edit, or create one."));
      const list = el("div", { class: "tb-tourlist" });
      tours.forEach((t) => list.append(el("button", { class: "tb-tour", onclick: () => openTour(t) },
        [el("strong", {}, t.title || t.id), el("span", { class: "tb-muted" }, ` ${(t.stops || []).length} stops · ${t.kind || "?"}`)])));
      rail.append(list);
      return;
    }
    // back + title
    rail.append(el("div", { class: "tb-row" }, [
      el("button", { class: "tb-btn", onclick: () => { cur = null; selLeg = -1; drawTour(); renderRail(); } }, "‹ Tours"),
      el("span", { id: "tb-status", class: "tb-muted" }, ""),
    ]));
    const title = el("input", { class: "tb-title", value: cur.title || "", placeholder: "Tour title" });
    title.addEventListener("input", () => { cur.title = title.value; markDirty(); });
    rail.append(title);
    rail.append(el("div", { class: "tb-meta" }, `${cur.stops.length} stops · ${totalKm().toFixed(1)} km`));

    // stops + legs
    const seq = el("ol", { class: "tb-seq" });
    cur.stops.forEach((s, i) => {
      const f = feats[s.ref];
      const custom = (s.chapters && s.chapters.length) || (Array.isArray(s.papers) && s.papers.length);
      const row = el("li", { class: "tb-stop" + (f ? "" : " missing") }, [
        el("span", { class: "tb-num" }, String(i + 1)),
        el("button", { class: "tb-name" + (i === selStop ? " sel" : ""), onclick: () => selectStop(i) },
          [(f ? f.name : s.ref + " (missing)"), custom ? el("span", { class: "tb-dot", title: "Has tour-specific content" }, " ●") : null]),
        el("span", { class: "tb-ctl" }, [
          el("button", { class: "tb-mini", title: "Move up", onclick: () => moveStop(i, -1) }, "↑"),
          el("button", { class: "tb-mini", title: "Move down", onclick: () => moveStop(i, 1) }, "↓"),
          el("button", { class: "tb-mini danger", title: "Remove", onclick: () => removeStop(i) }, "✕"),
        ]),
      ]);
      seq.append(row);
      if (i < cur.stops.length - 1) {
        const tr = cur.tracks[i];
        const km = tr && tr.coordinates && tr.coordinates.length > 1 ? (lineLen(tr.coordinates) / 1000).toFixed(2) : "—";
        seq.append(el("li", { class: "tb-leg" + (i === selLeg ? " sel" : ""), onclick: () => selectLeg(i) }, [
          el("span", { class: "tb-legline" }, "┈"),
          el("span", {}, `walk ${km} km`),
          (tr && tr.narration ? el("span", { class: "tb-tag" }, "narr") : null),
          (tr && tr.directions ? el("span", { class: "tb-tag" }, "dir") : null),
          el("span", { class: "tb-editlink" }, i === selLeg ? "editing ▾" : "edit route ›"),
        ]));
      }
    });
    rail.append(seq);

    // add stop
    const add = el("div", { class: "tb-add" });
    const dl = el("datalist", { id: "tb-pins" });
    featList.forEach((f) => dl.append(el("option", { value: f.name, "data-key": f.key })));
    const inp = el("input", { class: "tb-addinput", list: "tb-pins", placeholder: "Add a stop — search pins…" });
    inp.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      const f = featList.find((x) => x.name === inp.value);
      if (f) { addStop(f.key); inp.value = ""; } else setStatus("no pin by that name");
    });
    add.append(dl, inp, el("button", { class: "tb-btn", onclick: () => { const f = featList.find((x) => x.name === inp.value); if (f) { addStop(f.key); inp.value = ""; } } }, "Add"));
    rail.append(add);

    // detail editor: a selected stop (its content) or a selected leg (its track)
    if (selStop >= 0 && cur.stops[selStop]) renderStopEditor(rail, cur.stops[selStop], selStop);
    else if (selLeg >= 0 && cur.tracks[selLeg]) renderTrackEditor(rail, cur.tracks[selLeg], selLeg);
  }

  function renderTrackEditor(rail, tr, i) {
    const box = el("div", { class: "tb-track" });
    box.append(el("div", { class: "tb-track-h" }, `Track ${i + 1} → ${i + 2}  ·  ${(lineLen(tr.coordinates || []) / 1000).toFixed(2)} km`));
    box.append(el("div", { class: "tb-hint" }, "Click the orange line to add a via-point; drag a via to reshape; double-click a via to remove."));
    const dir = el("textarea", { class: "tb-ta", rows: 2, placeholder: "Directions (clear turn cues)…" }, tr.directions || "");
    dir.addEventListener("input", () => { tr.directions = dir.value; markDirty(); });
    const narr = el("textarea", { class: "tb-ta", rows: 3, placeholder: "Narration (ambient scene-setting for the walk)…" }, tr.narration || "");
    narr.addEventListener("input", () => { tr.narration = narr.value; markDirty(); });
    box.append(el("label", { class: "tb-lbl" }, "Directions"), dir, el("label", { class: "tb-lbl" }, "Narration"), narr);
    const modeBtn = el("button", { class: "tb-btn", onclick: () => { pushUndo(); tr.mode = tr.mode === "draw" ? "route" : "draw"; routeLeg(i); } }, tr.mode === "draw" ? "Mode: straight" : "Mode: auto-route");
    box.append(el("div", { class: "tb-row" }, [
      el("button", { class: "tb-btn", onclick: () => { pushUndo(); routeLeg(i); } }, "↻ Re-route"),
      modeBtn,
      el("button", { class: "tb-btn", onclick: () => { pushUndo(); tr.waypoints = []; routeLeg(i); } }, "Clear vias"),
    ]));
    rail.append(box);
  }

  // ---- stop content editor (per-tour narrative/media/newspaper) -------------
  function renderStopEditor(rail, s, i) {
    const f = feats[s.ref] || {};
    const box = el("div", { class: "tb-stopedit" });
    box.append(el("div", { class: "tb-track-h" }, `Stop ${i + 1}: ${f.name || s.ref}`));

    // --- the pin itself (shared everywhere it appears) ---
    renderPinSection(box, feats[s.ref]);

    // --- this tour only (per-tour overrides) ---
    box.append(el("div", { class: "tb-subhead tb-divider" }, ["This tour only ", el("span", { class: "tb-muted" }, "· overrides the pin here")]));
    box.append(el("div", { class: "tb-hint" }, "Leave chapters empty to use the pin's own deep-dive; the same pin can read differently in another tour."));
    box.append(el("label", { class: "tb-lbl" }, "Note — this tour's intro line"));
    const note = el("textarea", { class: "tb-ta", rows: 2, placeholder: "How this stop is framed in this tour…" }, s.note || "");
    note.addEventListener("input", () => { s.note = note.value; markDirty(); });
    box.append(note);

    box.append(el("div", { class: "tb-subhead" }, [
      el("span", {}, "Chapters"),
      el("button", { class: "tb-btn small", onclick: () => seedFromPin(s) }, "Seed from pin ↴"),
    ]));
    s.chapters = s.chapters || [];
    const chaps = el("div", { class: "tb-chaps" });
    s.chapters.forEach((c, ci) => chaps.append(chapterCard(s, c, ci)));
    box.append(chaps);
    box.append(el("button", { class: "tb-btn", onclick: () => { pushUndo(); s.chapters.push({ heading: "", body: [""], image: "", audio: "" }); markDirty(); renderRail(); } }, "+ Add chapter"));

    box.append(el("div", { class: "tb-subhead" }, "Newspaper sources"));
    s.papers = Array.isArray(s.papers) ? s.papers : [];
    const pl = el("div", { class: "tb-papers" });
    s.papers.forEach((p, pi) => {
      const lbl = el("input", { class: "tb-inp narrow", placeholder: "Label (SMH, 1938…)", value: p.label || "" });
      lbl.addEventListener("input", () => { p.label = lbl.value; markDirty(); });
      const url = el("input", { class: "tb-inp", placeholder: "https://trove.nla.gov.au/…", value: p.url || "" });
      url.addEventListener("input", () => { p.url = url.value; markDirty(); });
      pl.append(el("div", { class: "tb-paper" }, [lbl, url, el("button", { class: "tb-mini danger", onclick: () => { pushUndo(); s.papers.splice(pi, 1); markDirty(); renderRail(); } }, "✕")]));
    });
    box.append(pl);
    box.append(el("button", { class: "tb-btn", onclick: () => { pushUndo(); s.papers.push({ label: "", url: "" }); markDirty(); renderRail(); } }, "+ Add source"));
    rail.append(box);
  }

  // Edit the pin's canonical fields (name/summary/body/hero) — saved to the geojson.
  function renderPinSection(box, F) {
    if (!F || !F.feature) return;
    geoInPlay.add(F.type); // so undo snapshots include this pin's geojson while its fields are editable
    const props = F.feature.properties;
    const nameField = props.title !== undefined ? "title" : "name";
    box.append(el("div", { class: "tb-subhead" }, ["Pin content ", el("span", { class: "tb-muted" }, "· shared across tours")]));
    box.append(el("div", { class: "tb-hint" }, "Drag the numbered pin on the map to reposition it. These fields edit the pin everywhere it appears."));
    const name = el("input", { class: "tb-inp", value: props[nameField] || "", placeholder: "Name" });
    name.addEventListener("input", () => { props[nameField] = name.value; geoDirty.add(F.type); markDirty(); });
    box.append(el("label", { class: "tb-lbl" }, "Name"), name);
    const sum = el("textarea", { class: "tb-ta", rows: 2, placeholder: "Summary (the hover line)" }, props.summary || "");
    sum.addEventListener("input", () => { props.summary = sum.value; geoDirty.add(F.type); markDirty(); });
    box.append(el("label", { class: "tb-lbl" }, "Summary"), sum);
    const bf = BODY_FIELD[F.type];
    if (bf && bf !== "timeline") {
      const body = el("textarea", { class: "tb-ta", rows: 5, placeholder: "Body — leave a blank line between paragraphs" }, asArr(props[bf]).join("\n\n"));
      body.addEventListener("input", () => { props[bf] = body.value.split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean); geoDirty.add(F.type); markDirty(); });
      box.append(el("label", { class: "tb-lbl" }, "Body"), body);
    }
    const imgUrl = (v) => (typeof v === "string" ? v : (v && v.url) || "");
    const curImg = props.image ? imgUrl(props.image) : (Array.isArray(props.images) ? imgUrl(props.images[0]) : "");
    const img = el("input", { class: "tb-inp", value: curImg, placeholder: "Hero image URL" });
    const setImg = (u) => { props.image = u; geoDirty.add(F.type); markDirty(); }; // hero override; leaves images[] carousel intact
    img.addEventListener("input", () => setImg(img.value));
    const up = el("input", { type: "file", accept: "image/*", class: "tb-file" });
    up.addEventListener("change", async () => { const u = await uploadImage(up.files[0]); if (u) { img.value = u; setImg(u); } });
    box.append(el("label", { class: "tb-lbl" }, "Hero image"), el("div", { class: "tb-row" }, [img, up]));
  }

  function chapterCard(s, c, ci) {
    const swap = (a, b) => { if (b < 0 || b >= s.chapters.length) return; pushUndo(); [s.chapters[a], s.chapters[b]] = [s.chapters[b], s.chapters[a]]; markDirty(); renderRail(); };
    const card = el("div", { class: "tb-chap" });
    card.append(el("div", { class: "tb-chap-h" }, [
      el("span", {}, `Ch. ${ci + 1}`),
      el("span", { class: "tb-ctl" }, [
        el("button", { class: "tb-mini", title: "Up", onclick: () => swap(ci, ci - 1) }, "↑"),
        el("button", { class: "tb-mini", title: "Down", onclick: () => swap(ci, ci + 1) }, "↓"),
        el("button", { class: "tb-mini danger", title: "Remove", onclick: () => { pushUndo(); s.chapters.splice(ci, 1); markDirty(); renderRail(); } }, "✕"),
      ]),
    ]));
    const head = el("input", { class: "tb-inp", placeholder: "Chapter heading", value: c.heading || "" });
    head.addEventListener("input", () => { c.heading = head.value; markDirty(); });
    const body = el("textarea", { class: "tb-ta", rows: 4, placeholder: "Body — leave a blank line between paragraphs" }, asArr(c.body).join("\n\n"));
    body.addEventListener("input", () => { c.body = body.value.split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean); markDirty(); });
    const img = el("input", { class: "tb-inp", placeholder: "Image URL", value: c.image || "" });
    img.addEventListener("input", () => { c.image = img.value; markDirty(); });
    const up = el("input", { type: "file", accept: "image/*", class: "tb-file" });
    up.addEventListener("change", async () => { const u = await uploadImage(up.files[0]); if (u) { c.image = u; img.value = u; markDirty(); } });
    const audio = el("input", { class: "tb-inp", placeholder: "Narration audio URL (optional)", value: c.audio || "" });
    audio.addEventListener("input", () => { c.audio = audio.value; markDirty(); });
    card.append(head, body, el("label", { class: "tb-lbl" }, "Image"), el("div", { class: "tb-row" }, [img, up]),
      el("label", { class: "tb-lbl" }, "Narration (audio)"), audio);
    return card;
  }

  function seedFromPin(s) {
    pushUndo();
    const d = dossiersByAnchor[s.ref];
    if (d && Array.isArray(d.chapters) && d.chapters.length) {
      const out = [];
      for (const ch of d.chapters)
        for (const b of (ch.beats && ch.beats.length ? ch.beats : [{ heading: ch.title, body: [], images: [] }]))
          out.push({ heading: b.heading || ch.title || "", body: asArr(b.body), image: (b.images && b.images[0]) || ch.image || "", audio: b.audio || "" });
      s.chapters = out;
    } else {
      const f = feats[s.ref] || {};
      s.chapters = [{ heading: f.name || "", body: f.body && f.body.length ? f.body : asArr(f.summary), image: f.image || "", audio: "" }];
    }
    const pf = feats[s.ref];
    if (pf && pf.papers) { s.papers = s.papers || []; if (!s.papers.some((p) => p.url === pf.papers)) s.papers.push({ label: "From the papers", url: pf.papers }); }
    markDirty(); renderRail();
  }

  async function uploadImage(file) {
    if (!file) return null;
    const b64 = await new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(file); });
    try {
      const r = await fetch("/api/upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: file.name, data: b64 }) });
      const j = await r.json(); if (!j.ok) throw new Error(j.error); return j.url;
    } catch (e) { setStatus("upload failed: " + e.message); return null; }
  }

  // ---- tours -----------------------------------------------------------------
  function openTour(t) {
    cur = t; selLeg = -1; selStop = -1;
    cur.stops = cur.stops || []; cur.tracks = cur.tracks || [];
    cur.tracks.forEach((tr) => { tr.waypoints = tr.waypoints || []; tr.mode = tr.mode || "route"; });
    syncTracks();
    ensureMap(); drawTour(true); renderRail();
  }
  function newTour() {
    const title = (window.prompt("New tour title?") || "").trim(); if (!title) return;
    let id = slug(title), n = 1; while (tours.some((t) => t.id === id)) id = slug(title) + "-" + (++n);
    pushUndo();
    const t = { id, title, teaser: "", blurb: "", kind: "walk", year: "today", stops: [], tracks: [] };
    tours.push(t); markDirty(); openTour(t);
  }
  function totalKm() { return (cur.tracks || []).reduce((s, tr) => s + (tr.coordinates && tr.coordinates.length > 1 ? lineLen(tr.coordinates) : 0), 0) / 1000; }

  // ---- save ------------------------------------------------------------------
  function stripAndFinalize() {
    // recompute the cached `path` + walk_m/distance/duration from the tracks
    for (const t of tours) {
      if (!Array.isArray(t.tracks) || !t.tracks.length) continue;
      const route = [];
      t.tracks.forEach((tr, i) => { const c = tr.coordinates || []; if (i === 0) route.push(...c); else for (let v = 1; v < c.length; v++) route.push(c[v]); });
      if (route.length >= 2) {
        t.path = route;
        t.walk_m = Math.round(lineLen(route));
        t.distance_km = Math.round(t.walk_m / 100) / 10;
        t.duration_min = Math.max(5, Math.round((t.walk_m / 4000 * 60 + t.stops.length * 3) / 5) * 5);
      }
      // drop internal waypoint arrays? keep them — they let future edits re-route.
    }
  }
  async function saveOne(file, data) {
    const r = await fetch("/api/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ file, data }) });
    const j = await r.json();
    if (!j.ok) throw new Error(j.error || "save failed");
    return j;
  }
  async function saveTours() {
    stripAndFinalize();
    const geoFiles = [...geoDirty];
    setStatus(geoFiles.length ? `saving tours + ${geoFiles.length} pin file(s)…` : "saving…");
    try {
      await saveOne("tours.json", tours);
      for (const ty of geoFiles) await saveOne(geoData[ty].file, geoData[ty].gj); // moved pins / edited pin content
      geoDirty.clear();
      dirty = false; setStatus("saved ✓"); renderRail();
      window.dispatchEvent(new CustomEvent("tours-saved"));
    } catch (e) { setStatus("save failed: " + e.message); }
  }

  function markDirty() { dirty = true; const b = $("#tb-save"); if (b) b.disabled = false; }
  function setStatus(msg) { for (const id of ["tb-status", "tb-topstatus"]) { const s = document.getElementById(id); if (s) s.textContent = msg; } }

  async function publish() {
    if (dirty) await saveTours();
    setStatus("publishing…");
    try {
      const r = await fetch("/api/publish", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: "Update tours via tour builder" }) });
      const j = await r.json(); if (!j.ok) throw new Error(j.error);
      setStatus(j.detail || "published ✓");
    } catch (e) { setStatus("publish failed: " + e.message); }
  }

  // ---- entry -----------------------------------------------------------------
  async function open() {
    if (!loaded) { try { await loadData(); } catch (e) { $("#tb-rail").innerHTML = "Failed to load data: " + e.message; return; } }
    ensureMap(); renderRail();
    setTimeout(() => map && map.resize(), 60);
    if (!keyBound) {
      keyBound = true;
      // ⌘Z / Ctrl+Z undo, ⌘⇧Z / Ctrl+Y redo — only while the builder is on screen.
      document.addEventListener("keydown", (e) => {
        const z = e.key.toLowerCase() === "z", y = e.key.toLowerCase() === "y";
        if (!((e.metaKey || e.ctrlKey) && (z || y))) return;
        if (!builderActive()) return;
        e.preventDefault(); e.stopPropagation();
        (e.shiftKey && z) || y ? redo() : undo();
      }, true);
      // Snapshot before a field's value changes (coalesced per field, so a run
      // of keystrokes collapses into one undo step). beforeinput fires before
      // the model-mutating input handler, capturing the pre-edit state.
      const rail = $("#tb-rail");
      const snapField = (e) => {
        if (!e.target.matches || !e.target.matches("input, textarea")) return;
        const ctx = selStop >= 0 ? "s" + selStop : selLeg >= 0 ? "l" + selLeg : "t";
        pushUndo("f:" + ctx + ":" + (e.target.placeholder || e.target.className || ""));
      };
      if (rail) { rail.addEventListener("beforeinput", snapField); rail.addEventListener("focusin", snapField); }
    }
  }

  window.TourBuilder = { open, save: saveTours, publish };

  // Standalone page (tours.html) boots itself.
  if (document.body && document.body.dataset.standalone) {
    window.addEventListener("DOMContentLoaded", open);
    if (document.readyState !== "loading") open();
  }
})();

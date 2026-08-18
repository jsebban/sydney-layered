// --- Imagery layers: NSW Government tile services, oldest to newest ---
const SIXMAPS = "https://maps.six.nsw.gov.au/arcgis/rest/services";
const PORTAL = "https://portal.spatial.nsw.gov.au/tileservices/Hosted";
// Base path of this deployment (e.g. "/" locally, "/sydney-layered/" on GitHub Pages).
// Lets local /tiles/ and /img/ assets resolve under a subpath.
const SITE = location.origin + location.pathname.replace(/[^/]*$/, "");
const asset = (u) => (typeof u === "string" && u.startsWith("/") && !u.startsWith("//")) ? SITE + u.replace(/^\//, "") : u;

const YEARS = [
  {
    id: "country",
    label: "Country",
    tiles: `${SITE}tiles/era-country/{z}/{x}/{y}.jpg?v=20260621f`,
    tileBounds: [150.611572, -34.125448, 151.402588, -33.541395],
    minzoom: 10,
    maxzoom: 15,
    caption:
      "Synthesised from today's imagery: the real coastline and waterways, with all land returned to the bush that the national parks still preserve.",
  },
  {
    id: "1840",
    label: "1840",
    tiles: `${SITE}tiles/era-1840/{z}/{x}/{y}.jpg?v=20260621f`,
    tileBounds: [150.611572, -34.125448, 151.402588, -33.541395],
    minzoom: 10,
    maxzoom: 15,
    caption:
      "A reconstruction, not a photograph: the documented 1788\u20131840 settlement footprints, roads and clearings composited over re-wilded country.",
  },
  {
    id: "1899",
    label: "1899",
    tiles: `${SITE}tiles/era-1899/{z}/{x}/{y}.jpg?v=20260621f`,
    tileBounds: [150.611572, -34.125448, 151.402588, -33.541395],
    minzoom: 10,
    maxzoom: 15,
    caption:
      "A reconstruction of the Victorian city's spread \u2014 footprints, roads and railways to 1899, with town grain sampled from real 1943 imagery.",
  },
  {
    id: "1919",
    label: "1919",
    tiles: `${SITE}tiles/era-1919/{z}/{x}/{y}.jpg?v=20260621f`,
    tileBounds: [150.611572, -34.125448, 151.402588, -33.541395],
    minzoom: 10,
    maxzoom: 15,
    caption:
      "A reconstruction of Federation Sydney at the era's close \u2014 the tram and railway suburbs of the young Commonwealth, 1919.",
  },
  {
    id: "1943c",
    label: "1943 (colour)",
    tiles: `${SITE}tiles/era-1943c/{z}/{x}/{y}.jpg?v=20260621f`,
    tileBounds: [150.611572, -34.125448, 151.402588, -33.541395],
    minzoom: 10,
    maxzoom: 15,
    caption:
      "The real 1943 aerial survey, colourised — luminance from the wartime photographs, colour transferred from today's imagery of the same streets; beyond the survey's edge, the 1919 reconstruction continues.",
  },
  {
    id: "1943",
    label: "1943",
    tiles: `${SIXMAPS}/sixmaps/sydney1943/MapServer/tile/{z}/{y}/{x}`,
    maxzoom: 17,
    caption:
      "Wartime Sydney: trams everywhere, a castellated depot where the Opera House now stands, and Circular Quay open to the sky.",
  },
  {
    id: "1955",
    label: "1955",
    tiles: `${PORTAL}/HistoricalImagery1955/MapServer/tile/{z}/{y}/{x}`,
    maxzoom: 18,
    caption: "Post-war Sydney, before the Opera House and most of the high-rise CBD.",
  },
  {
    id: "1965",
    label: "1965",
    tiles: `${PORTAL}/HistoricalImagery1965/MapServer/tile/{z}/{y}/{x}`,
    maxzoom: 18,
    caption: "The Opera House shells are rising at Bennelong Point; the last trams have just gone.",
  },
  {
    id: "1970",
    label: "1970",
    tiles: `${PORTAL}/HistoricalImagery1970/MapServer/tile/{z}/{y}/{x}`,
    maxzoom: 18,
    caption: "The high-rise boom transforms the skyline; the Opera House nears completion.",
  },
  {
    id: "1975",
    label: "1975",
    tiles: `${PORTAL}/HistoricalImagery1975/MapServer/tile/{z}/{y}/{x}`,
    maxzoom: 18,
    fallback: ["1970", "1965"], // 1975 misses the CBD and the NW corridor; these two fill both
    caption: "Mid-seventies Sydney — the Opera House open, the green bans won, the west filling in.",
  },
  {
    id: "1994",
    label: "1994",
    tiles: `${PORTAL}/HistoricalImagery1994/MapServer/tile/{z}/{y}/{x}`,
    maxzoom: 18,
    caption: "Pre-Olympics Sydney, before the harbour's last working waterfront gave way to apartments.",
  },
  {
    id: "2005",
    label: "2005",
    tiles: `${PORTAL}/HistoricalImagery2005/MapServer/tile/{z}/{y}/{x}`,
    maxzoom: 18,
    caption: "The recent past — compare with today to watch the current city take shape.",
  },
  {
    id: "today",
    label: "Today",
    tiles: null, // the modern base imagery itself
    caption: "NSW Government's current aerial mosaic.",
  },
];

const HISTORICAL_ATTRIBUTION =
  "Historical imagery © Spatial Services, NSW Government";


const THEMES = [
  "First Nations",
  "Colony & Convicts",
  "Politics & Protest",
  "War & Defence",
  "Industry & Transport",
  "Sport & Leisure",
  "Arts & Ideas",
  "Science & Medicine",
  "Migration",
  "Crime & Catastrophe",
];

// --- Map: modern aerial as the base, one historical year shown on top ---
const MODERN_ATTRIBUTION =
  "Current imagery © Esri, Maxar, Earthstar Geographics & the GIS User Community";
const sources = {
  modern: {
    // Esri World Imagery: a seamless, uniformly colour-balanced global mosaic.
    // (Replaced the NSW_Imagery mosaic, whose survey-block joins showed as hard
    // colour seams in the current view; NSW imagery is retained for the
    // historical year layers below, which carry their own attribution.)
    type: "raster",
    tiles: [
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    ],
    tileSize: 256,
    // Stop requesting tiles above z18; MapLibre stretches the z18 tile for any
    // higher map zoom rather than fetching Esri's grey placeholder tiles.
    maxzoom: 18,
    attribution: MODERN_ATTRIBUTION,
  },
  labels: {
    type: "raster",
    tiles: [
      "https://a.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}@2x.png",
      "https://b.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}@2x.png",
      "https://c.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}@2x.png",
    ],
    tileSize: 256,
    attribution: "Labels © OpenStreetMap contributors © CARTO",
  },
};
for (const year of YEARS) {
  if (year.tiles) {
    sources[`year-${year.id}`] = {
      type: "raster",
      tiles: [year.tiles],
      tileSize: 256,
      minzoom: year.minzoom || 11,
      maxzoom: year.maxzoom,
      attribution: HISTORICAL_ATTRIBUTION,
      ...(year.tileBounds ? { bounds: year.tileBounds } : {}),
    };
  } else if (year.image) {
    const b = year.imageBounds;
    sources[`year-${year.id}`] = {
      type: "image",
      url: year.image,
      coordinates: [[b.west, b.north], [b.east, b.north], [b.east, b.south], [b.west, b.south]],
    };
  }
}

const EMPTY_FC = { type: "FeatureCollection", features: [] };
sources.world = {
  type: "geojson",
  data: {
    type: "Polygon",
    coordinates: [[[-180, -85], [180, -85], [180, 85], [-180, 85], [-180, -85]]],
  },
};
sources["coverage-active"] = { type: "geojson", data: EMPTY_FC };

// All year layers stay mounted at opacity 0 so their tiles preload —
// switching years is then an instant opacity flip, not a tile fetch.
// The dim layer sits under them: the active year's imagery covers it, so it
// only shows through wherever that year's survey has no coverage.
const hasLayer = (y) => Boolean(y.tiles || y.image);
const layers = [
  { id: "modern", type: "raster", source: "modern" },
  {
    id: "coverage-dim",
    type: "fill",
    source: "world",
    paint: { "fill-color": "#181512", "fill-opacity": 0.55 },
  },
];
for (const year of YEARS) {
  if (!hasLayer(year)) continue;
  layers.push({
    id: `year-${year.id}`,
    type: "raster",
    source: `year-${year.id}`,
    paint: { "raster-opacity": 0, "raster-fade-duration": 0 },
  });
}
layers.push({
  id: "coverage-outline",
  type: "line",
  source: "coverage-active",
  paint: {
    "line-color": "#f7f3ec",
    "line-width": 1.5,
    "line-dasharray": [2, 2],
    "line-opacity": 0.9,
  },
});
layers.push({
  id: "labels",
  type: "raster",
  source: "labels",
  layout: { visibility: "none" }, // default off; the sidebar toggle enables them
});

const map = new maplibregl.Map({
  container: "map",
  center: [151.13, -33.865], // greater Sydney: harbour to Parramatta in one view
  zoom: 11.3,
  // Capped at 18: beyond this Esri's World Imagery starts serving grey
  // "Map data not yet available" placeholder tiles in many areas.
  maxZoom: 18,
  // Built-in attribution off — we render our own tidy credits panel (#credits)
  // toggled by the ⓘ button, so the required credits stay available but unobtrusive.
  attributionControl: false,
  // Lets us read the canvas pixels (see matchSafeAreaColor) so the iOS
  // home-indicator strip can be painted to match the map's bottom edge.
  preserveDrawingBuffer: true,
  style: {
    version: 8,
    glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
    sources,
    layers,
  },
});

// (zoom/compass controls removed — touch pinch-zoom + the Explore/Near me UI cover navigation)
map.doubleClickZoom.disable(); // stop accidental double-tap zoom while tapping pins/buttons
// Keep the canvas filling the full (safe-area) viewport in the installed PWA.
// Resize the GL buffer to the container AND force a full repaint — otherwise the
// canvas can grow but keep stale (dark) pixels in the newly-exposed bottom strip.
const fitMap = () => { map.resize(); map.triggerRepaint(); };
window.addEventListener("resize", fitMap);
window.addEventListener("orientationchange", () => setTimeout(fitMap, 300));
// iOS settles the standalone viewport a beat after launch, so nudge a few times.
map.on("load", () => { fitMap(); [200, 500, 1200, 2500].forEach((t) => setTimeout(fitMap, t)); });
document.addEventListener("visibilitychange", () => { if (!document.hidden) setTimeout(fitMap, 100); });
window.addEventListener("pageshow", () => setTimeout(fitMap, 100));


// Unified pin click: query a PADDED box around the tap (bigger on touch) so
// pins are easy to hit, then open the nearest one. Tapping empty closes the
// open card. Playback (tour/dossier) handles its own navigation.
const SHOW_BY_TYPE = { story: showStory, building: showBuilding, people: showPerson, street: showStreet };
map.on("click", (e) => {
  if (creditsEl && creditsEl.classList.contains("open")) { setCredits(false); return; }
  // Mid-tour, the numbered stop badges are the tap targets: jump to that stop.
  if (activeTour && map.getLayer("tour-stop-badges")) {
    const bp = mqTouch.matches ? 16 : 6;
    const bbox = [[e.point.x - bp, e.point.y - bp], [e.point.x + bp, e.point.y + bp]];
    const hits = map.queryRenderedFeatures(bbox, { layers: ["tour-stop-badges"] });
    if (hits.length) {
      clearTourTimer();
      showTourStop(+hits[0].properties.label - 1);
      return;
    }
  }
  const layers = ["story-points", "building-points", "people-points"].filter((l) => map.getLayer(l));
  const pad = mqTouch.matches ? 18 : 5; // generous tap target on phones
  const box = [[e.point.x - pad, e.point.y - pad], [e.point.x + pad, e.point.y + pad]];
  const hits = layers.length ? map.queryRenderedFeatures(box, { layers }) : [];
  if (hits.length) {
    // nearest point hit to the actual tap point wins (best in dense clusters)
    let best = hits[0], bestd = Infinity;
    for (const h of hits) {
      const pt = map.project(h.geometry.coordinates);
      const d = (pt.x - e.point.x) ** 2 + (pt.y - e.point.y) ** 2;
      if (d < bestd) { bestd = d; best = h; }
    }
    // Tapping a pin navigates, even mid-dossier/tour: leave the current one first
    // so the new feature opens (and can launch its own deep dive).
    openFromList(SHOW_BY_TYPE[best.layer.id.split("-")[0]], best);
    return;
  }
  // no pin: a street line under the tap? (wider tolerance — lines are thin)
  if (map.getLayer("street-lines")) {
    const sp = mqTouch.matches ? 22 : 11;
    const sbox = [[e.point.x - sp, e.point.y - sp], [e.point.x + sp, e.point.y + sp]];
    const lineHits = map.queryRenderedFeatures(sbox, { layers: ["street-lines"] });
    if (lineHits.length) {
      const f = lineHits[0], dk = "street:" + f.properties.id;
      if (activeDossier) exitDossier();
      if (activeTour) exitTour();
      // Open the street and stay at the spot you tapped, not the line's midpoint.
      if (dossiersByAnchor[dk]) openDossier(dossiersByAnchor[dk], e.lngLat);
      else { suppressFly = true; showStreet(f); suppressFly = false; map.easeTo({ center: e.lngLat, duration: 500 }); }
      return;
    }
  }
  // Empty map: a tour/dossier has its own close controls, so leave it be.
  if (activeTour || activeDossier) return;
  if (!storyDetail.hidden) closeStory();
});


// --- Time travel: each period pairs its best rendition of Sydney with the
// people, places and stories that existed then. ---
const PERIODS = [
  {
    id: "indigenous", label: "Indigenous", year: "country", color: "#9c6b30",
    caption:
      "Gadigal, Wangal, Cammeraygal, Bidjigal, Gweagal Country — the real coastline with the land returned to bush, synthesised from the country the national parks still keep.",
  },
  {
    id: "colonial", label: "Colonial", range: "1788–1840", year: "1840", color: "#b34a26",
    caption:
      "A reconstruction: the documented footprints of the town, Parramatta and the early roads, stitched into the bush — not a photograph, but where the colony actually was.",
  },
  {
    id: "victorian", label: "Victorian", range: "1841–1899", year: "1899", color: "#2e6e4e",
    caption:
      "A reconstruction of the Victorian spread: the inner suburbs, the rail lines snaking west and south, the bush still holding everything beyond.",
  },
  {
    id: "federation", label: "Federation", range: "1900–1918", year: "1919", color: "#c9a227",
    caption: "A reconstruction of the city at the era's close, 1919 \u2014 the tram suburbs spreading along the new lines.",
  },
  {
    id: "wartime", label: "Wartime", range: "1919–1945", year: "1943c", color: "#7a7a52",
    caption: "The real 1943 aerial survey, colourised from today's imagery of the same streets — wartime Sydney, photographed mid-war, in colour.",
  },
  {
    id: "modern", label: "Modern", range: "1946–2005", year: "1975", color: "#3a6ea5",
    caption: "The mid-1970s aerial survey, with the 1965 run filling its city-centre gap — the Opera House open, the west filling in.",
  },
  {
    id: "now", label: "Now", year: "today", color: "#8a7a64",
    caption: "Everything, everywhere, all at once: every pin over today's imagery.",
  },
];

const PERIOD_BY_ID = Object.fromEntries(PERIODS.map((p) => [p.id, p]));

function periodOf(props) {
  // periods arrives as an array from raw GeoJSON, but as a JSON string from map click events.
  let periods = props.periods;
  if (typeof periods === "string") {
    try { periods = JSON.parse(periods); } catch (e) { periods = periods.split(/[\s,]+/).filter(Boolean); }
  }
  const first = (periods || [])[0];
  return PERIOD_BY_ID[first] || PERIOD_BY_ID.now;
}

const periodColorExpression = [
  "match",
  ["at", 0, ["get", "periods"]],
  ...PERIODS.filter((p) => p.id !== "now").flatMap((p) => [p.id, p.color]),
  "#888888",
];

// Era swatches in the legend (marker shapes are static HTML/CSS).
const legendEras = document.querySelector("#legend .legend-eras");
for (const period of PERIODS) {
  if (period.id === "now") continue;
  const row = document.createElement("div");
  row.className = "legend-row";
  row.innerHTML = `<span class="swatch era-dot" style="background:${period.color}"></span>${period.label} <span class="range">${period.range || ""}</span>`;
  legendEras.appendChild(row);
}

let activePeriod = "now";
let activeYear = "today";
let coverage = {}; // year id -> {rects, boundary}, from fetch_coverage.py
const yearChips = document.getElementById("year-chips");
const yearCaption = document.getElementById("year-caption");

function coverageOutline(id) {
  const segments = (coverage[id] && coverage[id].boundary) || [];
  if (!segments.length) return EMPTY_FC;
  return {
    type: "Feature",
    properties: {},
    geometry: { type: "MultiLineString", coordinates: segments },
  };
}

function setYear(id) {
  activeYear = id;
  const year = YEARS.find((y) => y.id === id);
  const visible = new Set([id]);
  if (year && year.fallback) {
    for (const fb of [].concat(year.fallback)) visible.add(fb);
  }
  for (const y of YEARS) {
    if (!hasLayer(y)) continue;
    map.setPaintProperty(`year-${y.id}`, "raster-opacity", visible.has(y.id) ? 1 : 0);
  }
  map.setPaintProperty("coverage-dim", "fill-opacity", hasLayer(year) ? 0.55 : 0);
  map.getSource("coverage-active").setData(EMPTY_FC);
}

function setPeriod(id) {
  activePeriod = id;
  const period = PERIODS.find((p) => p.id === id);
  setYear(period.year);
  // Reset era treatments, then apply this era's look.
  map.setPaintProperty("modern", "raster-saturation", 0);
  if (map.getLayer("year-1943")) {
    map.setPaintProperty("year-1943", "raster-brightness-min", 0);
    map.setPaintProperty("year-1943", "raster-contrast", 0);
  }
  const t = period.treatment;
  if (t) {
    if (t.saturation !== undefined) map.setPaintProperty(t.layer, "raster-saturation", t.saturation);
    if (t.brightnessMin !== undefined) map.setPaintProperty(t.layer, "raster-brightness-min", t.brightnessMin);
    if (t.contrast !== undefined) map.setPaintProperty(t.layer, "raster-contrast", t.contrast);
  }
  yearCaption.textContent = period.caption;
  document
    .querySelectorAll("#year-chips button")
    .forEach((b) => b.classList.toggle("active", b.dataset.id === id));
  applyFilters();
}

for (const period of PERIODS) {
  const btn = document.createElement("button");
  btn.dataset.id = period.id;
  btn.innerHTML = `<span class="dot" style="background:${period.color}"></span>${period.label}`;
  if (period.range) btn.title = period.range;
  btn.addEventListener("click", () => setPeriod(period.id));
  yearChips.appendChild(btn);
}

document.getElementById("labels-toggle").addEventListener("change", (e) => {
  map.setLayoutProperty("labels", "visibility", e.target.checked ? "visible" : "none");
});

// --- Filters: type (layer), era, theme ---
let activeTheme = null; // null = all themes
let activeSuburb = null; // {name, bbox, history?} when a suburb is selected
let suburbIds = null; // Set of feature ids inside the active suburb
let hoverTip = null;
const sidebar = document.getElementById("sidebar");
const storyDetail = document.getElementById("story-detail");

// --- Mobile bottom-sheet: the sidebar slides up over a full-screen map ---
const mqMobile = window.matchMedia("(max-width: 768px)");
const mqTouch = window.matchMedia("(hover: none), (pointer: coarse)");
const sidebarToggle = document.getElementById("sidebar-toggle");
const sheetClose = document.getElementById("sheet-close");
// Instant tap acknowledgement: a name pill that pops up the moment you tap,
// confirming the tap while the camera travels — then clears as the card arrives.
let tapHintEl = null, tapHintTimer = null;
function showTapHint(name) {
  if (!mqMobile.matches || !name) return;
  if (!tapHintEl) {
    tapHintEl = document.createElement("div");
    tapHintEl.id = "tap-hint";
    document.body.appendChild(tapHintEl);
  }
  tapHintEl.textContent = name;
  // force reflow so re-taps re-trigger the transition
  void tapHintEl.offsetWidth;
  tapHintEl.classList.add("show");
  clearTimeout(tapHintTimer);
  tapHintTimer = setTimeout(hideTapHint, 3500); // safety net
}
function hideTapHint() {
  clearTimeout(tapHintTimer);
  if (tapHintEl) tapHintEl.classList.remove("show");
}

function setSheet(open) {
  sidebar.classList.toggle("open", open);
  if (sidebarToggle) sidebarToggle.setAttribute("aria-expanded", open ? "true" : "false");
  if (open) hideTapHint(); // the card has arrived — drop the hint
  if (mqMobile.matches) {
    // When closed, the off-screen sheet must not be reachable by Tab.
    sidebar.toggleAttribute("inert", !open);
    if (open) sidebar.scrollTop = 0;
    else if (sidebarToggle) sidebarToggle.focus();
  } else {
    sidebar.removeAttribute("inert");
  }
}
if (sidebarToggle) sidebarToggle.addEventListener("click", () => setSheet(!sidebar.classList.contains("open")));
if (sheetClose) sheetClose.addEventListener("click", () => setSheet(false));
// Start closed (and inert) on phones; reconcile on rotate/resize across the breakpoint.
if (mqMobile.matches) sidebar.setAttribute("inert", "");
mqMobile.addEventListener("change", (e) => {
  if (e.matches) setSheet(sidebar.classList.contains("open"));
  else { sidebar.removeAttribute("inert"); sidebar.classList.remove("open"); }
});

// Legend: collapse to a small "Key" toggle on mobile so it stops covering the
// map, the attribution and the Explore button.
const legendEl = document.getElementById("legend");
if (legendEl) {
  const lt = document.createElement("button");
  lt.type = "button";
  lt.className = "legend-toggle";
  lt.textContent = "Key";
  lt.setAttribute("aria-label", "Toggle the map legend");
  legendEl.insertBefore(lt, legendEl.firstChild);
  lt.addEventListener("click", () => legendEl.classList.toggle("collapsed"));
  if (mqMobile.matches) legendEl.classList.add("collapsed");
}

// Custom map credits: the ⓘ opens a legible panel that pushes the bottom
// controls up by its own height; closes via ✕, Escape, or the ⓘ again.
const attribBtn = document.getElementById("attrib-btn");
const creditsEl = document.getElementById("credits");
function setCredits(open) {
  if (!creditsEl) return;
  creditsEl.hidden = false; // keep displayed (slides off-screen via transform)
  if (attribBtn) attribBtn.setAttribute("aria-expanded", open ? "true" : "false");
  if (open) {
    const panel = document.getElementById("credits-panel");
    void panel.offsetHeight; // reflow at the off-screen state so it slides in
    document.body.style.setProperty("--credits-h", panel.offsetHeight + "px");
    creditsEl.classList.add("open");
    document.body.classList.add("credits-open");
  } else {
    creditsEl.classList.remove("open");
    document.body.classList.remove("credits-open");
  }
}
if (attribBtn && creditsEl) {
  document.getElementById("credits-text").innerHTML = [
    MODERN_ATTRIBUTION,
    HISTORICAL_ATTRIBUTION,
    sources.labels.attribution,
  ].map((c) => `<p>${c}</p>`).join("");
  attribBtn.addEventListener("click", () => setCredits(!creditsEl.classList.contains("open")));
  document.getElementById("credits-close").addEventListener("click", () => setCredits(false));
  // tap anywhere on the catcher (i.e. not the panel) closes
  creditsEl.addEventListener("click", (e) => { if (e.target === creditsEl) setCredits(false); });
}

// Swipe the sheet down to dismiss it (only when scrolled to the top, so it
// doesn't fight normal list scrolling). The sheet follows the finger, then
// closes past a threshold or snaps back.
let sheetDragStart = null, sheetDragDy = 0, sheetDragging = false;
sidebar.addEventListener("touchstart", (e) => {
  if (!mqMobile.matches || !sidebar.classList.contains("open") || sidebar.scrollTop > 0) {
    sheetDragging = false;
    return;
  }
  sheetDragStart = e.touches[0].clientY;
  sheetDragDy = 0;
  sheetDragging = true;
  sidebar.style.transition = "none";
}, { passive: true });
sidebar.addEventListener("touchmove", (e) => {
  if (!sheetDragging) return;
  sheetDragDy = e.touches[0].clientY - sheetDragStart;
  if (sheetDragDy <= 0) { // dragging up = let it scroll normally
    sidebar.style.transform = "";
    sidebar.style.transition = "";
    sheetDragging = false;
    return;
  }
  e.preventDefault();
  sidebar.style.transform = `translateY(${sheetDragDy}px)`;
}, { passive: false });
sidebar.addEventListener("touchend", () => {
  if (!sheetDragging) return;
  sheetDragging = false;
  sidebar.style.transition = "";
  sidebar.style.transform = "";
  if (sheetDragDy > 110) {
    if (activeDossier) exitDossier();
    else if (activeTour) exitTour();
    else if (!storyDetail.hidden) closeStory();
    else setSheet(false);
  }
  sheetDragDy = 0;
}, { passive: true });
// Escape unwinds the active layer, then the sheet (desktop + mobile).
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  const lb = document.getElementById("lightbox");
  if (lb && lb.classList.contains("open")) { closeLightbox(); return; }
  const cr = document.getElementById("credits");
  if (cr && cr.classList.contains("open")) { setCredits(false); return; }
  if (activeDossier) exitDossier();
  else if (activeTour) exitTour();
  else if (!storyDetail.hidden) closeStory();
  else setSheet(false);
});

// Make the long pin-list sections collapsible (with a count); collapsed by
// default on phones to keep the sheet tidy and quick to scroll.
function setupCollapsibles() {
  document.querySelectorAll("section.collapsible").forEach((sec) => {
    const h2 = sec.querySelector("h2");
    if (!h2 || h2.dataset.wired) return;
    h2.dataset.wired = "1";
    const count = document.createElement("span");
    count.className = "sec-count";
    count.textContent = sec.querySelectorAll("li").length;
    h2.appendChild(count);
    h2.setAttribute("role", "button");
    h2.setAttribute("tabindex", "0");
    const toggle = () => {
      const collapsed = sec.classList.toggle("collapsed");
      h2.setAttribute("aria-expanded", collapsed ? "false" : "true");
    };
    h2.addEventListener("click", toggle);
    h2.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
    });
    if (mqMobile.matches) sec.classList.add("collapsed");
    h2.setAttribute("aria-expanded", sec.classList.contains("collapsed") ? "false" : "true");
  });
}

// Every feature, keyed "story:<id>" / "building:<id>" / "person:<id>" — tours reference these.
const featureIndex = {};

// --- Tours ---
let activeTour = null;
let tourIndex = 0;
let yearBeforeTour = null;
let tourPlaying = false;      // cinematic auto-play state
let tourTimer = null;         // pending auto-advance timer
const TOUR_DWELL = 7000;      // ms to dwell on each stop while auto-playing
// Deep dives ("dossiers"): a single landmark entry point that pages through
// its development (with period photos) and all its associated stories/people.
let dossiers = {};            // id -> dossier
let dossiersByAnchor = {};    // "building:scg" -> dossier
let activeDossier = null;
let dossierIndex = 0;
let absorbedIds = new Set();  // feature ids folded into a landmark — hidden as separate map pins
let suppressFly = false;      // keep the map still while paging a deep dive

// --- Cross-linking: the hidden graph, surfaced as "Connected" panels ---
let allTours = [];            // every tour, for "appears in" links
const tourMembership = {};    // feature key "type:id" -> [tourId, …]
const dossierLinks = {};      // feature key -> [other feature keys sharing a deep dive]

const TYPES = [
  { id: "story", label: "Stories", layer: "story-points", section: "stories-section" },
  { id: "building", label: "Buildings", layer: "building-points", section: "buildings-section" },
  { id: "person", label: "People", layer: "people-points", section: "people-section" },
  { id: "street", label: "Streets", layer: "street-lines", section: "streets-section" },
];
const typeVisible = { story: true, building: true, person: true, street: true };

// --- Visual hierarchy: every pin is always visible, but rank (stamped by
// pipeline/rank_features.py) grades size and opacity by zoom. At metro zoom
// the ~20 rank-1 icons read large and labelled while the long tail is fine
// grain that says "there's more here"; by street zoom everything is a full
// pin. Nothing is hidden, so exploration always has somewhere to go.
function rankRamp(z10, z13, z16) {
  const m = (v) => (Array.isArray(v) ? ["match", ["get", "rank"], 1, v[0], 2, v[1], v[2]] : v);
  return ["interpolate", ["linear"], ["zoom"], 10, m(z10), 13, m(z13), 16, m(z16)];
}
// Every pin the same size — a gentle zoom scale, identical across rank and type.
const PIN_RADIUS = ["interpolate", ["linear"], ["zoom"], 10, 4, 13, 5.5, 16, 7];
function combinedFilter() {
  const parts = [];
  if (activePeriod !== "now") parts.push(["in", activePeriod, ["get", "periods"]]);
  if (activeTheme) parts.push(["==", ["get", "theme"], activeTheme]);
  if (suburbIds) parts.push(["in", ["get", "id"], ["literal", [...suburbIds]]]);
  if (absorbedIds.size) parts.push(["!", ["in", ["get", "id"], ["literal", [...absorbedIds]]]]);
  return parts.length ? ["all", ...parts] : null;
}

function applyFilters() {
  for (const t of TYPES) {
    if (map.getLayer(t.layer)) map.setFilter(t.layer, combinedFilter());
  }
  document
    .querySelectorAll("#theme-filter button")
    .forEach((b) => b.classList.toggle("active", (b.dataset.id || null) === activeTheme));
  document.querySelectorAll("#story-list li, #building-list li, #people-list li").forEach((li) => {
    const periodOk =
      activePeriod === "now" || (li.dataset.periods || "").split(" ").includes(activePeriod);
    const themeOk = !activeTheme || li.dataset.theme === activeTheme;
    const suburbOk = !suburbIds || suburbIds.has(li.dataset.id);
    li.style.display = periodOk && themeOk && suburbOk ? "" : "none";
  });
  // Hide story era-groups left with no visible entries.
  document.querySelectorAll("#story-list .era-group").forEach((g) => {
    const any = [...g.querySelectorAll("li")].some((li) => li.style.display !== "none");
    g.style.display = any ? "" : "none";
  });
}

function setTheme(themeId) {
  activeTheme = themeId;
  applyFilters();
}

function setType(typeId, on) {
  typeVisible[typeId] = on;
  const t = TYPES.find((x) => x.id === typeId);
  if (map.getLayer(t.layer)) {
    map.setLayoutProperty(t.layer, "visibility", on ? "visible" : "none");
  }
  document.getElementById(t.section).style.display = on ? "" : "none";
}

// Type chips
const typeFilterEl = document.getElementById("type-filter");
for (const t of TYPES) {
  const btn = document.createElement("button");
  btn.dataset.id = t.id;
  btn.textContent = t.label;
  btn.classList.add("active");
  btn.addEventListener("click", () => {
    const on = !typeVisible[t.id];
    btn.classList.toggle("active", on);
    setType(t.id, on);
  });
  typeFilterEl.appendChild(btn);
}

// Theme chips
const themeFilterEl = document.getElementById("theme-filter");
const allThemesBtn = document.createElement("button");
allThemesBtn.textContent = "All";
allThemesBtn.classList.add("active");
allThemesBtn.addEventListener("click", () => setTheme(null));
themeFilterEl.appendChild(allThemesBtn);
for (const theme of THEMES) {
  const btn = document.createElement("button");
  btn.dataset.id = theme;
  btn.textContent = theme;
  btn.addEventListener("click", () => setTheme(theme));
  themeFilterEl.appendChild(btn);
}

function closeStory() {
  storyDetail.hidden = true;
  storyDetail.classList.remove("in-dossier");
  storyDetail.innerHTML = "";
  document
    .querySelectorAll("#story-list li, #building-list li")
    .forEach((li) => li.classList.remove("active"));
  sidebar.classList.remove("detail-mode");
  if (mqMobile.matches) setSheet(false); // back to the map on mobile
}

function detailImage(p) {
  if (!p.image) return "";
  const credit = p.image_link
    ? ` · <a href="${p.image_link}" target="_blank" rel="noopener">source ↗</a>`
    : "";
  return `<button class="story-img" type="button" aria-label="Expand image">
            <img src="${p.image}" alt="${p.image_caption || ""}" loading="lazy" />
          </button>
          <span class="caption">${p.image_caption || ""}${credit}</span>`;
}

const escAttr = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
// Inline formatting for body prose: escape HTML, then **bold** / *italic* / _italic_.
function inlineMd(s) {
  s = String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(^|[^*])\*(?!\s)([^*\n]+?)\*/g, "$1<em>$2</em>");
  s = s.replace(/(^|[^\w])_(?!\s)([^_\n]+?)_(?![\w])/g, "$1<em>$2</em>");
  return s;
}
// Map-click features arrive with nested props as JSON strings; un-stringify to an array.
function asArray(v) {
  if (Array.isArray(v)) return v;
  if (typeof v === "string") {
    const t = v.trim();
    if (t.startsWith("[")) { try { return JSON.parse(t); } catch (e) {} }
    return t ? [v] : [];
  }
  return v ? [v] : [];
}
// Normalise a chapter/feature's images to [{url,caption,link}] (supports the old single-image fields).
function mediaList(o) {
  const imgs = asArray(o.images);
  if (imgs.length && typeof imgs[0] === "object") return imgs.filter((m) => m && m.url);
  if (o.image) return [{ url: o.image, caption: o.image_caption, link: o.image_link }];
  return [];
}
// One image -> a tappable figure; several -> a swipeable/clickable carousel.
function mediaHtml(media) {
  if (!media.length) return "";
  if (media.length === 1) {
    const m = media[0];
    const credit = m.link ? ` · <a href="${m.link}" target="_blank" rel="noopener">source ↗</a>` : "";
    return `<button class="story-img" type="button" aria-label="Expand image"><img src="${asset(m.url)}" alt="${escAttr(m.caption)}" loading="lazy" /></button>
            <span class="caption">${m.caption || ""}${credit}</span>`;
  }
  const slides = media.map((m) =>
    `<button class="story-img cslide" type="button" data-cap="${escAttr(m.caption)}" data-link="${escAttr(m.link)}"><img src="${asset(m.url)}" alt="${escAttr(m.caption)}" loading="lazy" /></button>`
  ).join("");
  const dots = media.map((_, k) => `<button class="cdot" type="button" aria-label="Image ${k + 1}"></button>`).join("");
  return `<div class="carousel">
    <div class="carousel-viewport"><div class="carousel-track">${slides}</div></div>
    <button class="carousel-nav cprev" type="button" aria-label="Previous image">‹</button>
    <button class="carousel-nav cnext" type="button" aria-label="Next image">›</button>
    <div class="carousel-dots">${dots}</div>
    <span class="caption ccap"></span>
  </div>`;
}
// Wire every carousel inside a container: arrows, dots, touch-swipe, per-slide caption.
function wireCarousels(root) {
  root.querySelectorAll(".carousel").forEach((c) => {
    const track = c.querySelector(".carousel-track");
    const slides = [...c.querySelectorAll(".cslide")];
    const dots = [...c.querySelectorAll(".cdot")];
    const cap = c.querySelector(".ccap");
    let i = 0;
    const show = (n) => {
      i = (n + slides.length) % slides.length;
      track.style.transform = `translateX(${-i * 100}%)`;
      dots.forEach((d, k) => d.classList.toggle("on", k === i));
      const s = slides[i];
      const credit = s.dataset.link ? ` · <a href="${s.dataset.link}" target="_blank" rel="noopener">source ↗</a>` : "";
      cap.innerHTML = (s.dataset.cap || "") + credit;
    };
    c.querySelector(".cprev").addEventListener("click", (e) => { e.stopPropagation(); show(i - 1); });
    c.querySelector(".cnext").addEventListener("click", (e) => { e.stopPropagation(); show(i + 1); });
    dots.forEach((d, k) => d.addEventListener("click", (e) => { e.stopPropagation(); show(k); }));
    let x0 = null;
    c.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    c.addEventListener("touchend", (e) => {
      if (x0 == null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) show(dx < 0 ? i + 1 : i - 1);
      x0 = null;
    });
    show(0);
    // Auto-rotate so a multi-photo set reads as a gallery, not a single image.
    // The first touch or click hands control to the user for good.
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const spin = setInterval(() => {
        if (!c.isConnected) { clearInterval(spin); return; } // container was re-rendered
        if (!document.hidden) show(i + 1);
      }, 4500);
      c.addEventListener("pointerdown", () => clearInterval(spin), { once: true });
    }
  });
}

// --- Photo-first card helpers ---
// One-line hook: the first sentence of the body/first story, for the card lead-in.
function hookOf(p) {
  const src = asArray(p.body)[0] || asArray(p.stories)[0] || p.blurb || "";
  const plain = String(src).replace(/[*_]/g, "").trim();
  const m = plain.match(/^.*?[.!?](\s|$)/);
  const s = m ? m[0].trim() : plain;
  return s.length > 140 ? s.slice(0, 137).trim() + "…" : s;
}
// Prominent CTA into the swipeable deep dive, when one exists for this feature.
function deepDiveCta(typeKey) {
  const d = dossiersByAnchor[typeKey];
  if (!d) return "";
  const n = (d.chapters || []).length;
  const label = n > 1 ? `Read the story · ${n} chapters →` : "Read the story →";
  return `<button class="deepdive-cta" type="button" data-anchor="${escAttr(typeKey)}">${label}</button>`;
}

function fmtPaperDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
  if (!m) return iso || "";
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${parseInt(m[3])} ${months[parseInt(m[2]) - 1]} ${m[1]}`;
}

function detailPapers(p) {
  let arts = p.articles;
  if (typeof arts === "string") {
    try { arts = JSON.parse(arts); } catch (e) { arts = null; }
  }
  if (arts && arts.length) {
    const items = arts
      .map(
        (a) =>
          `<li><a href="${a.url}" target="_blank" rel="noopener">“${a.heading}”</a><span class="paper-meta">${a.newspaper || ""}${a.date ? " · " + fmtPaperDate(a.date) : ""}</span></li>`
      )
      .join("");
    const more = p.papers
      ? `<a class="papers-more" href="${p.papers}" target="_blank" rel="noopener">Search more on Trove ↗</a>`
      : "";
    return `<div class="papers-block"><span class="papers-label">From the papers</span><ul class="paper-list">${items}</ul>${more}</div>`;
  }
  return p.papers
    ? `<a class="papers" href="${p.papers}" target="_blank" rel="noopener">From the papers — original reports on Trove ↗</a>`
    : "";
}

// --- Image lightbox: fullscreen viewer with swipe-through gallery + zoom ---
let lbGallery = [], lbIndex = 0;
function openLightbox(gallery, index) {
  lbGallery = gallery.filter((g) => g && g.url);
  if (!lbGallery.length) return;
  lbIndex = index || 0;
  let lb = document.getElementById("lightbox");
  if (!lb) {
    lb = document.createElement("div");
    lb.id = "lightbox";
    lb.innerHTML =
      `<button class="lb-close" aria-label="Close image">✕</button>` +
      `<button class="lb-nav lb-prev" aria-label="Previous image">‹</button>` +
      `<button class="lb-nav lb-next" aria-label="Next image">›</button>` +
      `<div class="lb-scroll"><img class="lb-img" alt="" /></div>` +
      `<div class="lb-cap"></div>`;
    document.body.appendChild(lb);
    lb.querySelector(".lb-close").addEventListener("click", (e) => { e.stopPropagation(); closeLightbox(); });
    lb.addEventListener("click", (e) => { if (e.target === lb || e.target.classList.contains("lb-scroll")) closeLightbox(); });
    lb.querySelector(".lb-img").addEventListener("click", (e) => { e.stopPropagation(); lb.classList.toggle("zoomed"); });
    lb.querySelector(".lb-prev").addEventListener("click", (e) => { e.stopPropagation(); lbShow(lbIndex - 1); });
    lb.querySelector(".lb-next").addEventListener("click", (e) => { e.stopPropagation(); lbShow(lbIndex + 1); });
    let x0 = null;
    const sc = lb.querySelector(".lb-scroll");
    sc.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    sc.addEventListener("touchend", (e) => {
      if (x0 == null || lb.classList.contains("zoomed")) { x0 = null; return; }
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 45) lbShow(lbIndex + (dx < 0 ? 1 : -1));
      x0 = null;
    });
  }
  lbShow(lbIndex);
  lb.classList.add("open");
}
function lbShow(i) {
  const lb = document.getElementById("lightbox");
  if (!lb || !lbGallery.length) return;
  lbIndex = (i + lbGallery.length) % lbGallery.length;
  const m = lbGallery[lbIndex];
  lb.classList.remove("zoomed");
  lb.querySelector(".lb-img").src = m.url;
  lb.querySelector(".lb-img").alt = m.caption || "";
  lb.querySelector(".lb-cap").textContent = m.caption || "";
  const multi = lbGallery.length > 1;
  lb.querySelector(".lb-prev").style.display = multi ? "" : "none";
  lb.querySelector(".lb-next").style.display = multi ? "" : "none";
}
function closeLightbox() {
  const lb = document.getElementById("lightbox");
  if (lb) lb.classList.remove("open");
}
// Tapping a card/tour/carousel image opens the fullscreen viewer. From a carousel,
// the whole set is loaded so you can swipe through it fullscreen.
storyDetail.addEventListener("click", (e) => {
  const wrap = e.target.closest(".story-img, .tour-stop-img");
  if (!wrap) return;
  e.preventDefault();
  const carousel = wrap.closest(".carousel");
  if (carousel) {
    const slides = [...carousel.querySelectorAll(".cslide")];
    const gallery = slides.map((s) => { const im = s.querySelector("img"); return { url: im.currentSrc || im.src, caption: s.dataset.cap || im.alt }; });
    openLightbox(gallery, slides.indexOf(wrap.closest(".cslide")));
  } else {
    const img = wrap.matches("img") ? wrap : wrap.querySelector("img");
    if (img) openLightbox([{ url: img.currentSrc || img.src, caption: img.alt }], 0);
  }
});

function openDetail(html) {
  if (hoverTip) hoverTip.remove();
  storyDetail.innerHTML = `<button class="close" title="Close">×</button>` + html;
  storyDetail.hidden = false;
  wireCarousels(storyDetail);
  storyDetail
    .querySelector(".close")
    .addEventListener("click", () =>
      activeDossier ? exitDossier() : activeTour ? exitTour() : closeStory()
    );
  // "Read the story →" opens the swipeable deep-dive chapters.
  const cta = storyDetail.querySelector(".deepdive-cta");
  if (cta) cta.addEventListener("click", () => {
    const d = dossiersByAnchor[cta.dataset.anchor];
    if (d) openDossier(d);
  });
  // On mobile the sheet is raised by the caller AFTER the camera settles
  // (flyToFeature / show*), so the card doesn't cover the zoom-in.
  if (mqMobile.matches) sidebar.classList.add("detail-mode");
  sidebar.scrollTo({ top: 0, behavior: "smooth" });
  storyDetail.setAttribute("tabindex", "-1");
  storyDetail.focus({ preventScroll: true }); // land keyboard/SR focus on the new content
}

// --- "Connected" panels: surface tour/dossier/proximity links between features ---
function metersBetween(a, b) {
  const R = 6371000, toR = Math.PI / 180;
  const x = (b[0] - a[0]) * toR * Math.cos(((a[1] + b[1]) / 2) * toR);
  const y = (b[1] - a[1]) * toR;
  return Math.sqrt(x * x + y * y) * R;
}

// Open any feature by its "type:id" key — flies to it and shows its panel.
// Leaves any active tour/dossier first so the link lands in free-browse mode.
// Fly to a feature; on mobile, raise the sheet only once the camera has
// settled (so the card doesn't cover the zoom). Includes a no-move shortcut
// and a timing backstop so the card always ends up open.
function featureCenter(f) {
  const g = f.geometry;
  if (g.type === "LineString") return g.coordinates[Math.floor(g.coordinates.length / 2)];
  if (g.type === "MultiLineString") {
    const pts = g.coordinates.flat();
    return pts[Math.floor(pts.length / 2)];
  }
  return g.coordinates;
}
// Bounding box [[minLng,minLat],[maxLng,maxLat]] over any geometry, for fitBounds.
function featureBounds(f) {
  const g = f.geometry;
  let pts;
  if (g.type === "LineString") pts = g.coordinates;
  else if (g.type === "MultiLineString") pts = g.coordinates.flat();
  else return [g.coordinates, g.coordinates];
  let m = [Infinity, Infinity], M = [-Infinity, -Infinity];
  for (const [x, y] of pts) { if (x < m[0]) m[0] = x; if (y < m[1]) m[1] = y; if (x > M[0]) M[0] = x; if (y > M[1]) M[1] = y; }
  return [m, M];
}
function flyToFeature(feature) {
  const coords = featureCenter(feature);
  const cur = map.getCenter();
  const willMove =
    Math.abs(cur.lng - coords[0]) > 1e-5 ||
    Math.abs(cur.lat - coords[1]) > 1e-5 ||
    map.getZoom() < 15.4;
  const raise = () => { if (mqMobile.matches) setSheet(true); };
  if (!willMove) { raise(); return; }
  if (mqMobile.matches) {
    showTapHint(feature.properties.name || feature.properties.title); // instant tap feedback
    let done = false;
    const open = () => { if (done) return; done = true; raise(); };
    map.once("moveend", open);
    setTimeout(open, 2400);
  }
  map.flyTo({ center: coords, zoom: Math.max(map.getZoom(), 15.5), speed: 0.9, essential: true });
}

function openFeature(key) {
  const f = featureIndex[key];
  if (!f) return;
  if (activeDossier) exitDossier();
  if (activeTour) exitTour();
  const type = key.split(":")[0];
  const show = { story: showStory, building: showBuilding, person: showPerson, street: showStreet }[type];
  showTapHint(f.properties.name || f.properties.title); // confirm the tap immediately
  // Cinematic hop: close the current card, fly across the map, then open the
  // new card on arrival (so on mobile you actually watch the journey).
  let done = false;
  const reveal = () => {
    if (done) return;
    done = true;
    suppressFly = true; // we've already flown — just open the card
    show(f);
    suppressFly = false;
  };
  closeStory(); // drop the current card (on mobile, lowers the sheet to reveal the map)
  const c = map.getCenter();
  const [lng, lat] = f.geometry.coordinates;
  const moved = Math.abs(c.lng - lng) > 1e-5 || Math.abs(c.lat - lat) > 1e-5;
  if (!moved) { reveal(); return; }
  map.once("moveend", reveal);
  setTimeout(reveal, 2600); // backstop if a moveend is ever missed
  map.flyTo({ center: [lng, lat], zoom: Math.max(map.getZoom(), 15.5), speed: 0.8, curve: 1.6, essential: true });
}

// Sidebar list clicks open a feature fresh. They MUST leave any active
// dossier/tour first, otherwise the dossier-launch guard in show* (which is
// gated on !activeDossier && !activeTour, so chapter playback doesn't recurse)
// stays suppressed and you get the bare card instead of the deep dive.
function openFromList(show, feature) {
  if (activeDossier) exitDossier();
  if (activeTour) exitTour();
  show(feature);
}

// Gather related features for one key, grouped and de-duplicated across groups.
function relatedFor(key) {
  const self = featureIndex[key];
  if (!self || !self.geometry) return null;
  const selfCoords = featureCenter(self);
  const sp = self.properties;
  const used = new Set([key]);
  const take = (keys, n) => {
    const out = [];
    for (const k of keys) {
      if (out.length >= n) break;
      if (!used.has(k) && featureIndex[k]) { used.add(k); out.push(k); }
    }
    return out;
  };
  // Editorial cross-links curated on the card itself ("learn more"), reserved first.
  const editorial = take((sp.related || []).filter((k) => featureIndex[k]), 6);
  const tours = (tourMembership[key] || []).map((id) => allTours.find((t) => t.id === id)).filter(Boolean);
  const coRefs = [];
  for (const t of tours) for (const s of t.stops) coRefs.push(s.ref);
  const coStops = take(coRefs, 4);
  const dossier = take(dossierLinks[key] || [], 4);
  const near = [];
  for (const k in featureIndex) {
    if (used.has(k)) continue;
    const f = featureIndex[k];
    if (!f.geometry || f.geometry.type !== "Point") continue;
    const d = metersBetween(selfCoords, f.geometry.coordinates);
    if (d <= 500) near.push([k, d]);
  }
  near.sort((a, b) => a[1] - b[1]);
  const nearby = take(near.map((n) => n[0]), 5);
  let affinity = [];
  if (coStops.length + dossier.length + nearby.length < 3) {
    const aff = [];
    for (const k in featureIndex) {
      if (used.has(k)) continue;
      const p = featureIndex[k].properties;
      if (p.theme && p.theme === sp.theme && p.era === sp.era) aff.push(k);
    }
    affinity = take(aff, 3);
  }
  return { editorial, tours, coStops, dossier, nearby, affinity };
}

function relatedChip(k) {
  const f = featureIndex[k];
  const type = k.split(":")[0];
  const name = f.properties.name || f.properties.title;
  return `<button class="rel-chip" data-key="${k}"><span class="rel-dot ${type}"></span>${name}</button>`;
}

// Built into the detail panels. Hidden during tour/dossier playback (those have their own nav).
function relatedHtml(key) {
  if (activeTour || activeDossier) return "";
  const r = relatedFor(key);
  if (!r) return "";
  const seg = (label, keys) =>
    keys.length
      ? `<div class="rel-group"><span class="rel-label">${label}</span><div class="rel-chips">${keys.map(relatedChip).join("")}</div></div>`
      : "";
  let blocks = "";
  blocks += seg("Learn more", r.editorial);
  if (r.tours.length)
    blocks += `<div class="rel-group"><span class="rel-label">Appears in</span><div class="rel-chips">${r.tours
      .map((t) => `<button class="rel-tour" data-tour="${t.id}">▸ ${t.title}</button>`)
      .join("")}</div></div>`;
  blocks += seg("Along the same tour", r.coStops);
  blocks += seg("In the same deep dive", r.dossier);
  blocks += seg("Nearby", r.nearby);
  blocks += seg("Same theme &amp; era", r.affinity);
  if (!blocks) return "";
  return `<div class="connected"><h4 class="connected-title">Connected</h4>${blocks}</div>`;
}

// Delegated: connection chips persist across openDetail()'s innerHTML rewrites.
storyDetail.addEventListener("click", (e) => {
  const chip = e.target.closest(".rel-chip");
  if (chip && chip.dataset.key) { e.preventDefault(); openFeature(chip.dataset.key); return; }
  const tchip = e.target.closest(".rel-tour");
  if (tchip && tchip.dataset.tour) {
    const t = allTours.find((x) => x.id === tchip.dataset.tour);
    if (t) startTour(t);
  }
});

function clearTourTimer() {
  if (tourTimer) { clearTimeout(tourTimer); tourTimer = null; }
}

// Queue the next stop while auto-playing; stop at the end.
function scheduleAdvance() {
  clearTourTimer();
  if (!activeTour || !tourPlaying) return;
  if (tourIndex >= activeTour.stops.length - 1) { setTourPlaying(false); return; }
  tourTimer = setTimeout(() => showTourStop(tourIndex + 1), TOUR_DWELL);
}

function setTourPlaying(on) {
  tourPlaying = on;
  clearTourTimer();
  const el = tourStopEl();
  if (el) {
    el.classList.toggle("playing", on);
    const btn = el.querySelector(".tplay");
    if (btn) { btn.innerHTML = on ? "❚❚" : "▶"; btn.title = on ? "Pause" : "Auto-play"; }
  }
  if (on) scheduleAdvance();
}

function exitTour() {
  clearTourTimer();
  tourPlaying = false;
  // Cancel any running preview fly-through and its Skip affordance.
  previewOn = false;
  previewToken++;
  if (previewTimer) { clearTimeout(previewTimer); previewTimer = null; }
  if (previewDrawTimer) { clearInterval(previewDrawTimer); previewDrawTimer = null; }
  hideStopLabel();
  const skip = document.getElementById("preview-skip");
  if (skip) skip.remove();
  activeTour = null;
  document.body.classList.remove("in-tour");
  clearTimeout(showTourStop._t);
  const el = tourStopEl();
  if (el) {
    el.classList.remove("show", "playing");
    setTimeout(() => { if (!activeTour) { el.hidden = true; el.innerHTML = ""; } }, 420);
  }
  const pill = document.getElementById("ts-pill");
  if (pill) pill.remove();
  const intro = document.getElementById("ts-intro");
  if (intro) intro.remove();
  map.getSource("tour-route").setData(EMPTY_FC);
  map.getSource("tour-route-done").setData(EMPTY_FC);
  map.getSource("tour-stops").setData(EMPTY_FC);
  closeWalkCard();
  stopBeacon();
  map.easeTo({ pitch: 0, bearing: 0, duration: 600 });
  if (yearBeforeTour && yearBeforeTour !== activeYear) setYear(yearBeforeTour);
  yearBeforeTour = null;
  // Restore the ordinary pins to whatever the type filters had them at.
  for (const t of TYPES) {
    if (map.getLayer(t.layer)) map.setLayoutProperty(t.layer, "visibility", typeVisible[t.id] ? "visible" : "none");
  }
  document.querySelectorAll("#tour-list li").forEach((li) => li.classList.remove("active"));
  closeStory();
  showLauncher(); // tour-first: leaving a tour returns to the picker, not the free map
}

const tourStopEl = () => document.getElementById("tourstop");

// Show/hide the stop overlay. Hidden-with-a-tour-running leaves a bottom pill
// so walkers can see the map (and their guide dot) between stops.
function setTourOverlay(open) {
  const el = tourStopEl();
  let pill = document.getElementById("ts-pill");
  if (open) {
    el.hidden = false;
    void el.offsetHeight; // reflow so the slide-up transition runs
    el.classList.add("show");
    if (pill) pill.remove();
  } else {
    el.classList.remove("show");
    if (!activeTour) return;
    if (!pill) {
      pill = document.createElement("button");
      pill.id = "ts-pill";
      pill.type = "button";
      pill.addEventListener("click", () => setTourOverlay(true));
      document.body.appendChild(pill);
    }
    pill.textContent = `▲ Stop ${tourIndex + 1} of ${activeTour.stops.length} · ${activeTour.title}`;
  }
}

// One stop's content as a full-screen "beat" (same layout language as the
// chapter reader: media pane + words pane, split on wide screens).
// Per-tour stop chapters (override the pin's own content for this tour).
function stopChaptersHtml(stop) {
  return (stop.chapters || []).map((c) => {
    const img = c.image ? `<div class="story-img"><img src="${asset(c.image)}" alt="" loading="lazy"></div>` : "";
    const audio = c.audio ? `<audio class="ts-audio" controls preload="none" src="${asset(c.audio)}"></audio>` : "";
    const paras = asArray(c.body).map((x) => `<p class="beat-p">${inlineMd(x)}</p>`).join("");
    return `<section class="ts-chap">${c.heading ? `<h3 class="ts-chap-h">${inlineMd(c.heading)}</h3>` : ""}${img}${audio}${paras}</section>`;
  }).join("");
}
function stopPapersHtml(stop) {
  if (!Array.isArray(stop.papers) || !stop.papers.length) return "";
  return `<div class="ts-papers"><span class="ts-papers-h">From the papers</span>${stop.papers
    .filter((p) => p && p.url)
    .map((p) => `<a href="${p.url}" target="_blank" rel="noopener">${p.label || p.url}</a>`).join("")}</div>`;
}

function tourStopContent(stop, feature) {
  const p = feature.properties;
  const branches = Array.isArray(stop.branches) && stop.branches.length
    ? `<div class="tour-branches"><span class="tour-branch-label">Choose a path</span>${stop.branches
        .map((b, bi) => `<button class="tbranch" data-bi="${bi}">${b.label} ›</button>`)
        .join("")}</div>`
    : "";

  // This tour gives the stop its own chapters → render those (the pin can read
  // differently in another tour). Otherwise fall back to the pin's content.
  if (Array.isArray(stop.chapters) && stop.chapters.length) {
    return `<div class="beat beat-in beat-textonly">
      <div class="beat-words">
        ${stop.note ? `<p class="ts-note">${inlineMd(stop.note)}</p>` : ""}
        <h2 class="beat-h">${p.title || p.name}</h2>
        ${stopChaptersHtml(stop)}
        ${stopPapersHtml(stop)}
        ${stop.quote ? `<blockquote class="tour-quote">${inlineMd(stop.quote)}</blockquote>` : ""}
        ${branches}
      </div>
      <div class="beat-film"></div>
    </div>`;
  }

  const timeline = typeof p.timeline === "string" ? JSON.parse(p.timeline) : (p.timeline || []);
  const stories = typeof p.stories === "string" ? JSON.parse(p.stories) : (p.stories || []);
  const media = mediaList(p).slice();
  if (stop.image) media.unshift({ url: stop.image, caption: stop.caption || "", link: "" });
  const paras = asArray(p.body).concat(Array.isArray(stories) ? stories : []);
  return `<div class="beat beat-in${media.length ? "" : " beat-textonly"}">
    <div class="beat-lead">${mediaHtml(media)}</div>
    <div class="beat-words">
      ${stop.note ? `<p class="ts-note">${inlineMd(stop.note)}</p>` : ""}
      <h2 class="beat-h">${p.title || p.name}</h2>
      ${paras.map((x) => `<p class="beat-p">${inlineMd(x)}</p>`).join("")}
      ${timeline.length ? `<ul class="timeline ts-timeline">${timeline.map((t) => `<li><span class="tl-year">${t.year}</span><span>${t.event}</span></li>`).join("")}</ul>` : ""}
      ${stop.quote ? `<blockquote class="tour-quote">${inlineMd(stop.quote)}</blockquote>` : ""}
      ${stopPapersHtml(stop)}
      ${branches}
    </div>
    <div class="beat-film"></div>
  </div>`;
}

function showTourStop(i) {
  const intro = document.getElementById("ts-intro");
  if (intro) intro.remove();
  tourIndex = i;
  closeWalkCard();       // arriving at a stop dismisses any between-stops walk card
  paintTourProgress(i);  // fill the walked route, advance the beacon, restate badges
  const stop = activeTour.stops[i];
  const feature = featureIndex[stop.ref];
  const last = i === activeTour.stops.length - 1;
  const leg = activeTour.kind === "walk" ? legInfo(i) : null; // the walk to the NEXT stop
  const el = tourStopEl();

  // Fly first: the overlay drops while the camera travels, so every page turn
  // shows the hop across the map before the next stop rises.
  const cam = stop.camera || {};
  map.flyTo({
    center: featureCenter(feature),
    zoom: cam.zoom ?? Math.max(map.getZoom(), 15.5),
    pitch: cam.pitch ?? 0,
    bearing: cam.bearing ?? 0,
    speed: tourPlaying ? 0.6 : 0.9,
    curve: 1.5,
    essential: true,
  });

  const render = () => {
    if (!activeTour) return; // the tour ended while we were mid-flight
    el.innerHTML = `
      <div class="rch-top">
        <button class="ts-peek" type="button" title="See the map">▾ Map</button>
        <span class="rch-count">${activeTour.title} · ${i + 1}/${activeTour.stops.length}</span>
        <button class="reader-close texit" aria-label="End tour">×</button>
      </div>
      <div class="ts-scroll">${tourStopContent(stop, feature)}</div>
      ${leg ? `<button class="ts-nextbar" type="button">
        <span class="tnb-lead">Next</span>
        <span class="tnb-name">${featNameOf(activeTour.stops[i + 1])}</span>
        <span class="tnb-meta">${fmtMeters(leg.dist)} · ~${leg.mins} min</span>
        <span class="tnb-go">Walk ›</span></button>` : ""}
      <div class="rch-nav">
        <button class="rb-prev tprev" ${i === 0 ? "disabled" : ""}>‹ Back</button>
        <button class="ts-play tplay" title="${tourPlaying ? "Pause" : "Auto-play"}">${tourPlaying ? "❚❚" : "▶"}</button>
        <div class="rb-dots">${activeTour.stops.map((_, k) => `<span class="rb-dot ${k === i ? "on" : ""}"></span>`).join("")}</div>
        <button class="rb-next tnext">${last ? "Finish" : leg ? "Walk on ›" : "Next ›"}</button>
      </div>`;
    wireCarousels(el);
    el.classList.toggle("playing", tourPlaying);
    el.querySelector(".tprev").addEventListener("click", () => { clearTourTimer(); showTourStop(i - 1); });
    // On foot: advancing opens the between-stops walk card first (directions +
    // ambient narration); armchair tours jump straight to the next stop.
    const advance = () => { clearTourTimer(); if (last) return exitTour(); leg ? showWalkLeg(i) : showTourStop(i + 1); };
    el.querySelector(".tnext").addEventListener("click", advance);
    const nb = el.querySelector(".ts-nextbar");
    if (nb) nb.addEventListener("click", advance);
    el.querySelector(".tplay").addEventListener("click", () => setTourPlaying(!tourPlaying));
    el.querySelector(".texit").addEventListener("click", exitTour);
    el.querySelector(".ts-peek").addEventListener("click", () => setTourOverlay(false));
    el.querySelectorAll(".tbranch").forEach((btn) =>
      btn.addEventListener("click", () => { clearTourTimer(); followBranch(stop.branches[+btn.dataset.bi]); }));
    el.querySelector(".ts-scroll").scrollTop = 0;
    setTourOverlay(true);
  };
  // Slide the current stop away, let the flight breathe, then raise the next.
  const wasShowing = !el.hidden && el.classList.contains("show");
  el.classList.remove("show");
  clearTimeout(showTourStop._t);
  showTourStop._t = setTimeout(render, wasShowing ? 2100 : 1100);

  // Keep auto-play chaining.
  if (tourPlaying) scheduleAdvance();
}

// --- Progressive route + stop-state beacon ---------------------------------
const lineFC = (coords) => ({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: coords } });

// Build the tour's route and the vertex index each stop sits at, so the line
// can be cut into "walked" and "still ahead" as the tour advances. Prefer the
// explicit TRACKS (per-leg geometry); fall back to a legacy `path`, then to
// straight hops between stops.
function routeProgressSetup(tour) {
  const stopCoords = tour.stops.map((s) => featureIndex[s.ref].geometry.coordinates);
  if (Array.isArray(tour.tracks) && tour.tracks.length) {
    // Stitch the per-leg tracks into one route; each stop sits at a track boundary.
    const route = [], split = [];
    tour.tracks.forEach((tr, i) => {
      const c = tr.coordinates || [];
      if (i === 0) { route.push(...c); split.push(0); }        // stop 0 at index 0
      else { for (let v = 1; v < c.length; v++) route.push(c[v]); }
      split.push(route.length - 1);                            // stop i+1
    });
    tour._route = route;
    tour._splitIdx = split;
    return;
  }
  const usesPath = Array.isArray(tour.path) && tour.path.length >= 2;
  const route = usesPath ? tour.path : stopCoords;
  tour._route = route;
  tour._splitIdx = stopCoords.map((c, i) => {
    if (!usesPath) return i; // hop route: stop i IS vertex i
    let best = 0, bd = Infinity;
    for (let v = 0; v < route.length; v++) {
      const d = metersBetween(c, route[v]);
      if (d < bd) { bd = d; best = v; }
    }
    return best;
  });
}

// Paint the walked portion solid, the rest faint; recolour the badges by state;
// float the beacon over the next stop. i = current stop index (-1 at the intro).
function paintTourProgress(i) {
  if (!activeTour || !activeTour._route) return;
  const route = activeTour._route, split = activeTour._splitIdx;
  const cut = i < 0 ? 0 : Math.min(route.length - 1, split[i]);
  const done = route.slice(0, cut + 1);
  const ahead = route.slice(cut);
  map.getSource("tour-route-done").setData(done.length >= 2 ? lineFC(done) : EMPTY_FC);
  map.getSource("tour-route").setData(ahead.length >= 2 ? lineFC(ahead) : EMPTY_FC);
  map.getSource("tour-stops").setData({
    type: "FeatureCollection",
    features: activeTour.stops.map((s, k) => ({
      type: "Feature",
      properties: {
        label: String(k + 1),
        state: k < i ? "done" : k === i ? "current" : k === i + 1 ? "next" : "upcoming",
      },
      geometry: featureIndex[s.ref].geometry,
    })),
  });
  const next = activeTour.stops[i + 1];
  if (next) { beaconCoord = featureIndex[next.ref].geometry.coordinates; startBeacon(); }
  else stopBeacon();
}

// A gentle expanding-ring pulse on the next stop (map has no native pulse).
let beaconCoord = null, beaconRAF = null;
function startBeacon() {
  if (beaconRAF || !map.getSource("tour-beacon")) return;
  const tick = () => {
    if (!activeTour || !beaconCoord) { stopBeacon(); return; }
    const t = (Date.now() % 1600) / 1600;            // 0 → 1 each 1.6 s
    map.setPaintProperty("tour-beacon", "circle-radius", 10 + t * 24);
    map.setPaintProperty("tour-beacon", "circle-opacity", 0.45 * (1 - t));
    map.getSource("tour-beacon").setData({ type: "Feature", properties: {}, geometry: { type: "Point", coordinates: beaconCoord } });
    beaconRAF = requestAnimationFrame(tick);
  };
  beaconRAF = requestAnimationFrame(tick);
}
function stopBeacon() {
  if (beaconRAF) cancelAnimationFrame(beaconRAF);
  beaconRAF = null; beaconCoord = null;
  if (map.getSource("tour-beacon")) map.getSource("tour-beacon").setData(EMPTY_FC);
}

// --- The "in-between": per-leg directions, distance/time and walk narration ---
const fmtMeters = (m) => (m < 950 ? Math.round(m / 10) * 10 + " m" : (m / 1000).toFixed(1) + " km");
function featNameOf(stop) {
  const f = stop && featureIndex[stop.ref];
  return f ? (f.properties.name || f.properties.title || f.properties.id) : "";
}

// The walk from stop `from` to `from`+1: the slice of the route between them,
// its real on-path distance, and a 4.5 km/h time. Returns null when there's no
// next stop or the tour has no drawn path to follow.
function legInfo(from) {
  if (!activeTour || !activeTour._route) return null;
  const to = from + 1;
  if (to >= activeTour.stops.length) return null;
  const route = activeTour._route, split = activeTour._splitIdx;
  const a = Math.min(split[from], split[to]), b = Math.max(split[from], split[to]);
  const seg = route.slice(a, b + 1);
  if (seg.length < 2) return null;
  let d = 0;
  for (let i = 1; i < seg.length; i++) d += metersBetween(seg[i - 1], seg[i]);
  return { from, to, seg, dist: d, mins: Math.max(1, Math.round(d / 4500 * 60)) };
}

const walkCardEl = () => document.getElementById("walkcard");

// Show the between-stops walk card: highlight this leg on the map, beacon the
// next stop, frame the leg, and read out the ambient narration for the walk.
function showWalkLeg(from) {
  const info = legInfo(from);
  if (!info) { showTourStop(from + 1); return; }
  const nextStop = activeTour.stops[info.to];
  const nf = featureIndex[nextStop.ref];
  clearTourTimer();
  // Drop the full stop overlay to reveal the map (no peek pill — the walk card is the UI).
  const ts = tourStopEl();
  if (ts) ts.classList.remove("show");
  const pill = document.getElementById("ts-pill"); if (pill) pill.remove();
  // Brightly highlight the leg to walk, and pulse the destination.
  map.getSource("tour-leg").setData(lineFC(info.seg));
  beaconCoord = nf.geometry.coordinates; startBeacon();
  // Frame the whole leg, leaving room for the bottom sheet.
  let bnds = null;
  for (const c of info.seg) bnds = bnds ? bnds.extend(c) : new maplibregl.LngLatBounds(c, c);
  if (bnds) map.fitBounds(bnds, { padding: { top: 70, left: 50, right: 50, bottom: Math.round(window.innerHeight * 0.45) }, maxZoom: 17, duration: 900 });
  // The track connecting these two stops carries the directions + narration.
  const track = (activeTour.tracks || [])[from] || null;
  renderWalkCard(info, nextStop, nf, track);
}

function renderWalkCard(info, nextStop, nf, track) {
  const el = walkCardEl();
  if (!el) { showTourStop(info.to); return; }
  const np = nf.properties;
  const n = activeTour.stops.length;
  const directions = track && track.directions
    ? `<p class="wc-dir">${inlineMd(track.directions)}</p>` : "";
  const narration = track && track.narration
    ? `<p class="wc-narr">${inlineMd(track.narration)}</p>`
    : `<p class="wc-narr subtle">Follow the highlighted path to the next stop.</p>`;
  el.innerHTML = `
    <div class="wc-grip"></div>
    <div class="wc-top">
      <span class="wc-count">On the way · stop ${info.to + 1} of ${n}</span>
      <button class="wc-x reader-close" aria-label="End tour">×</button>
    </div>
    <div class="wc-lead">
      <span class="wc-arrow">→</span>
      <span class="wc-to"><strong>${np.name || np.title}</strong>
        <span class="wc-meta">${fmtMeters(info.dist)} · about ${info.mins} min on foot</span></span>
    </div>
    ${directions}
    ${narration}
    <div class="wc-nav">
      <button class="wc-back" type="button">‹ Back to stop ${info.from + 1}</button>
      <button class="wc-go" type="button">I'm here — open stop ›</button>
    </div>`;
  el.querySelector(".wc-x").addEventListener("click", exitTour);
  el.querySelector(".wc-back").addEventListener("click", () => showTourStop(info.from));
  el.querySelector(".wc-go").addEventListener("click", () => showTourStop(info.to));
  el.hidden = false;
  void el.offsetHeight;      // reflow so the slide-up runs
  el.classList.add("show");
}

function closeWalkCard() {
  const el = walkCardEl();
  if (el && !el.hidden) {
    el.classList.remove("show");
    setTimeout(() => { if (!el.classList.contains("show")) { el.hidden = true; el.innerHTML = ""; } }, 380);
  }
  if (map.getSource("tour-leg")) map.getSource("tour-leg").setData(EMPTY_FC);
}

// --- Cinematic preview: MapLibre eases the camera stop-to-stop -------------
let previewOn = false, previewToken = 0, previewTimer = null, previewDrawTimer = null;
let previewSpeed = 1;                  // 1× / 2× / 3× — set live via the preview control

function bearingBetween(a, b) {
  const toR = Math.PI / 180;
  const dLng = (b[0] - a[0]) * toR, la1 = a[1] * toR, la2 = b[1] * toR;
  const y = Math.sin(dLng) * Math.cos(la2);
  const x = Math.cos(la1) * Math.sin(la2) - Math.sin(la1) * Math.cos(la2) * Math.cos(dLng);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

// Frame the whole route at the overview (used by the intro screen and after a preview).
function fitTourOverview(duration = 1000) {
  if (!activeTour || !activeTour._route) return;
  let bnds = null;
  for (const c of activeTour._route) bnds = bnds ? bnds.extend(c) : new maplibregl.LngLatBounds(c, c);
  if (bnds) map.fitBounds(bnds, { padding: 80, maxZoom: 16, pitch: 0, bearing: 0, duration });
}

// Light up the stops reached so far during a preview: earlier stops read as
// "visited", the one just reached is highlighted, the rest stay faint.
function paintPreviewStops(reached) {
  if (!activeTour) return;
  map.getSource("tour-stops").setData({
    type: "FeatureCollection",
    features: activeTour.stops.map((s, k) => ({
      type: "Feature",
      properties: { label: String(k + 1), state: k < reached ? "done" : k === reached ? "current" : "upcoming" },
      geometry: featureIndex[s.ref].geometry,
    })),
  });
}

// A card that pops up at each stop during the preview's pause: photo, name and
// a one-line summary, so you know what's coming.
let previewPopup = null;
function showStopCard(k) {
  if (!activeTour) return;
  const f = featureIndex[activeTour.stops[k].ref], p = f.properties;
  const name = p.name || p.title || p.id;
  let line = String(asArray(p.summary)[0] || "").replace(/[*_]/g, "").trim() || hookOf(p);
  if (line.length > 120) line = line.slice(0, 117).trim() + "…";
  const img = p.image ? `<div class="pvc-img" style="background-image:url('${p.image}')"></div>` : "";
  const html = `<div class="pvc">${img}<div class="pvc-body">
      <span class="pvc-num">Stop ${k + 1} of ${activeTour.stops.length}</span>
      <strong class="pvc-name">${name}</strong>
      ${line ? `<span class="pvc-line">${line}</span>` : ""}
    </div></div>`;
  if (!previewPopup) previewPopup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 18, anchor: "bottom", maxWidth: "250px", className: "pv-popup" });
  previewPopup.setLngLat(featureCenter(f)).setHTML(html).addTo(map);
}
function hideStopLabel() { if (previewPopup) previewPopup.remove(); }

// Cinematic preview: MapLibre eases the camera stop-to-stop (smooth even when a
// frame drops), pausing at each to light it up and show its card, drawing the
// line in as it goes. Skip (or ✕) cuts back to the overview.
function previewTour() {
  if (previewOn || !activeTour || !activeTour._route || activeTour._route.length < 2) return;
  const route = activeTour._route, split = activeTour._splitIdx, stops = activeTour.stops;
  const cum = [0];
  for (let i = 1; i < route.length; i++) cum.push(cum[i - 1] + metersBetween(route[i - 1], route[i]));
  previewOn = true;
  previewSpeed = 1;
  const token = ++previewToken;
  const live = () => previewOn && token === previewToken && activeTour;
  setPreviewChrome(true);
  stopBeacon();
  clearTourTimer();
  map.getSource("tour-route-done").setData(EMPTY_FC);
  paintPreviewStops(-1);

  const ZOOM = 14.4, PITCH = 45, DWELL = 1500;
  const stopCoord = (k) => featureIndex[stops[k].ref].geometry.coordinates;
  const heading = (k) => (k < stops.length - 1 ? bearingBetween(stopCoord(k), stopCoord(k + 1)) : map.getBearing());
  const drawUpTo = (vtx) => { const d = route.slice(0, vtx + 1); if (d.length >= 2) map.getSource("tour-route-done").setData(lineFC(d)); };
  const easeSine = (t) => 0.5 * (1 - Math.cos(Math.PI * t));

  const goLeg = (k) => {
    if (!live()) return;
    const prevV = k > 0 ? split[k - 1] : 0, curV = split[k];
    const legDist = Math.max(1, cum[curV] - cum[prevV]);
    const baseDur = k === 0 ? 1600 : Math.min(5000, Math.max(1900, legDist * 5)); // gentle, length-scaled
    const dur = baseDur / previewSpeed; // live speed control (1× / 2× / 3×)
    // Draw the line in across the leg on a light timer, decoupled from the camera.
    if (previewDrawTimer) clearInterval(previewDrawTimer);
    const t0 = performance.now();
    previewDrawTimer = setInterval(() => {
      if (!live()) { clearInterval(previewDrawTimer); return; }
      const f = Math.min(1, (performance.now() - t0) / dur);
      const dd = cum[prevV] + (cum[curV] - cum[prevV]) * f;
      let i = prevV; while (i < curV && cum[i] < dd) i++;
      drawUpTo(i);
      if (f >= 1) clearInterval(previewDrawTimer);
    }, 90);
    // MapLibre owns the camera motion — smooth, and it copes with dropped frames.
    map.easeTo({ center: stopCoord(k), zoom: ZOOM, pitch: PITCH, bearing: heading(k), duration: dur, easing: easeSine });
    previewTimer = setTimeout(() => {
      if (!live()) return;
      drawUpTo(curV);
      paintPreviewStops(k);
      showStopCard(k);
      previewTimer = setTimeout(() => {
        if (!live()) return;
        hideStopLabel();
        if (k + 1 >= stops.length) { endPreview(); return; }
        goLeg(k + 1);
      }, DWELL / previewSpeed);
    }, dur + 60);
  };
  goLeg(0);
}

function endPreview() {
  if (!previewOn) return;
  previewOn = false;
  previewToken++;
  if (previewTimer) { clearTimeout(previewTimer); previewTimer = null; }
  if (previewDrawTimer) { clearInterval(previewDrawTimer); previewDrawTimer = null; }
  hideStopLabel();
  setPreviewChrome(false);
  if (activeTour) { paintTourProgress(-1); fitTourOverview(1100); } // back to the overview
}

// Swap the intro bar for the preview controls (speed toggle + Skip) while flying.
const PREVIEW_SPEEDS = [1, 2, 3];
function setPreviewChrome(on) {
  const intro = document.getElementById("ts-intro");
  if (intro) intro.style.display = on ? "none" : "";
  let bar = document.getElementById("preview-ctrl");
  if (on && !bar) {
    bar = document.createElement("div");
    bar.id = "preview-ctrl";
    const speed = document.createElement("button");
    speed.id = "preview-speed";
    speed.type = "button";
    const sync = () => { speed.textContent = previewSpeed + "× speed"; };
    sync();
    speed.addEventListener("click", () => {
      previewSpeed = PREVIEW_SPEEDS[(PREVIEW_SPEEDS.indexOf(previewSpeed) + 1) % PREVIEW_SPEEDS.length];
      sync(); // takes effect from the next leg/pause
    });
    const skip = document.createElement("button");
    skip.id = "preview-skip";
    skip.type = "button";
    skip.textContent = "Skip preview ⏭";
    skip.addEventListener("click", endPreview);
    bar.append(speed, skip);
    document.body.appendChild(bar);
  } else if (!on && bar) {
    bar.remove();
  }
}

// A branch can jump to another stop index in this tour, or to any feature.
function followBranch(branch) {
  if (!branch) return;
  if (typeof branch.goto === "number") return showTourStop(branch.goto);
  if (branch.goto && featureIndex[branch.goto]) {
    const idx = activeTour.stops.findIndex((s) => s.ref === branch.goto);
    if (idx >= 0) return showTourStop(idx);
    return openFeature(branch.goto); // off-tour jump
  }
}

function startTour(tour) {
  clearTourTimer();
  tourPlaying = false;
  document.body.classList.add("in-tour");  // locks into the tour: hides the sidebar + ◆ Tours button
  hideLauncher();                          // leave the landing screen for the map
  if (typeof map !== "undefined") map.resize(); // sidebar gone on desktop → let the map fill
  closeStory(); // drop any open card/sheet: the stop overlay is the tour UI
  activeTour = tour;
  tourIndex = -1; // no stop open yet (the route overview shows first)
  document.querySelectorAll("#tour-list li").forEach((li) => {
    li.classList.toggle("active", li.dataset.id === tour.id);
  });
  if (tour.year) {
    yearBeforeTour = activeYear;
    setYear(tour.year);
  }
  const coords = tour.stops.map((s) => featureIndex[s.ref].geometry.coordinates);
  // Walking tours carry a precomputed pedestrian path (pipeline/route_walks.py)
  // that follows real streets and tracks; other tours draw straight hops.
  // Map each stop onto the route so it can be split into walked/ahead, then
  // paint the "nothing done yet" state (stop 1 glows as the next beacon).
  routeProgressSetup(tour);
  paintTourProgress(-1);
  // During a tour, hide the ordinary pins so only the tour's route and stops show.
  for (const t of TYPES) {
    if (map.getLayer(t.layer)) map.setLayoutProperty(t.layer, "visibility", "none");
  }
  // Show the whole route first: fit the camera to it and offer Start, so you
  // can see where the tour goes (and tap any numbered stop) before diving in.
  let bnds = null;
  for (const c of tour.path || coords) bnds = bnds ? bnds.extend(c) : new maplibregl.LngLatBounds(c, c);
  if (bnds) map.fitBounds(bnds, { padding: 80, maxZoom: 16, duration: 1200 });
  showTourIntro(tour, coords);
}

// The pre-stop overview bar: title, size, and a Start button. Tapping a
// numbered badge on the map (or arriving at a stop on foot) also starts it.
function showTourIntro(tour, coords) {
  let bar = document.getElementById("ts-intro");
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "ts-intro";
    document.body.appendChild(bar);
  }
  let dist = tour.walk_m || 0;
  if (!dist) for (let i = 1; i < coords.length; i++) dist += metersBetween(coords[i - 1], coords[i]);
  // real path distance at 4 km/h plus a few minutes' dwell per stop
  const mins = tour.kind === "walk"
    ? Math.round((dist / 4000 * 60 + tour.stops.length * 3) / 5) * 5
    : Math.max(5, Math.round((tour.stops.length * 4) / 5) * 5);
  const meta = [`${tour.stops.length} stops`,
                tour.kind === "walk" ? `${(dist / 1000).toFixed(1)} km on foot` : null,
                `~${mins} min`].filter(Boolean).join(" · ");
  const canReroll = tour.id === "dynamic" && typeof window.regenWalkingTour === "function";
  bar.innerHTML = `
    <div class="tsi-text"><strong>${tour.title}</strong><span>${meta}</span></div>
    ${canReroll ? `<button class="tsi-reroll" type="button" title="Different route">↻</button>` : ""}
    <button class="tsi-preview" type="button" title="Fly the route">▶ Preview</button>
    <button class="tsi-start" type="button">Start ›</button>
    <button class="tsi-x" type="button" aria-label="Back to tours">✕</button>`;
  bar.querySelector(".tsi-preview").addEventListener("click", previewTour);
  bar.querySelector(".tsi-start").addEventListener("click", () => showTourStop(0));
  bar.querySelector(".tsi-x").addEventListener("click", exitTour); // back to the tour picker
  if (canReroll) bar.querySelector(".tsi-reroll").addEventListener("click", async (e) => {
    e.target.disabled = true;
    await window.regenWalkingTour();
  });
}

// Fetch JSON with retries so a transient network blip never leaves the map empty.
async function fetchJSON(url, tries = 3) {
  let err;
  for (let a = 0; a < tries; a++) {
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error("HTTP " + r.status);
      return await r.json();
    } catch (e) {
      err = e;
      if (a < tries - 1) await new Promise((res) => setTimeout(res, 300));
    }
  }
  throw err;
}

// --- Deep dives: a landmark's full story as a paged series of cards ---
async function loadDossiers() {
  // Retry on a failed/partial fetch so a transient read never leaves dossiers empty.
  let list = null;
  for (let attempt = 0; attempt < 3 && !list; attempt++) {
    try {
      list = await (await fetch("data/dossiers.json?v=" + Date.now())).json();
    } catch (e) {
      console.warn("loadDossiers: retrying after failed fetch", e);
      await new Promise((r) => setTimeout(r, 300));
    }
  }
  if (!list) { console.error("loadDossiers: could not load dossiers.json"); return; }
  for (const d of list) {
    dossiers[d.id] = d;
    dossiersByAnchor[d.anchor] = d;
    for (const ch of d.chapters) {
      // fold every associated feature (but not the landmark itself) into the mother pin
      if (ch.ref && ch.ref !== d.anchor) absorbedIds.add(ch.ref.split(":")[1]);
    }
    // Library-format dossiers carry no chapter refs; an explicit absorb list
    // folds features whose stories the chapters retell (e.g. BridgeClimb).
    for (const key of d.absorb || []) {
      if (key !== d.anchor) absorbedIds.add(key.split(":")[1]);
    }
  }
  // Cross-link: every feature in a dossier is "in the same deep dive" as the others.
  for (const d of list) {
    const keys = [...new Set([d.anchor, ...d.chapters.filter((c) => c.ref).map((c) => c.ref), ...(d.absorb || [])])]
      .filter((k) => featureIndex[k]);
    for (const k of keys) (dossierLinks[k] ||= []).push(...keys.filter((o) => o !== k));
  }
  console.log("[dossiers] loaded", Object.keys(dossiersByAnchor).length, "anchors");
  window.__dossiersByAnchor = dossiersByAnchor;
  try { applyFilters(); } catch (e) { console.warn("[dossiers] applyFilters failed (non-fatal)", e); }
}

function exitDossier() {
  const r = readerEl();
  if (r && !r.hidden) { closeStoryMode(); return; } // full-screen reader open
  activeDossier = null;
  storyDetail.classList.remove("in-dossier");
  closeStory();
}

function showDossierChapter(i) {
  dossierIndex = i;
  const d = activeDossier;
  const ch = d.chapters[i];
  const last = i === d.chapters.length - 1;
  suppressFly = true; // a deep dive stays anchored on its mother pin — no jumping about
  if (ch.ref) {
    const f = featureIndex[ch.ref];
    const type = ch.ref.split(":")[0];
    ({ story: showStory, building: showBuilding, person: showPerson, street: showStreet })[type](f);
  } else {
    openDetail(`
      ${mediaHtml(mediaList(ch))}
      <h3>${ch.heading}</h3>
      ${(Array.isArray(ch.body) ? ch.body : [ch.body]).map((p) => `<p>${inlineMd(p)}</p>`).join("")}`);
  }
  suppressFly = false;
  const nav = document.createElement("div");
  nav.className = "tour-nav dossier-nav";
  nav.innerHTML = `
    <div class="tour-head"><strong>${d.title}</strong><span>Deep dive · ${i + 1} of ${d.chapters.length}</span></div>
    <div class="tour-buttons">
      <button class="tprev" ${i === 0 ? "disabled" : ""}>‹ Back</button>
      <button class="tnext">${last ? "Finish" : "Next ›"}</button>
      <button class="texit">Close</button>
    </div>`;
  storyDetail.insertBefore(nav, storyDetail.children[1]);
  nav.querySelector(".tprev").addEventListener("click", () => showDossierChapter(i - 1));
  nav.querySelector(".tnext").addEventListener("click", () => (last ? exitDossier() : showDossierChapter(i + 1)));
  nav.querySelector(".texit").addEventListener("click", exitDossier);
}

function openDossier(d, center) {
  // "library"-format deep dives open in the full-screen choose-your-own reader.
  if (d && d.format === "library") { openStoryMode(d); return; }
  activeDossier = d;
  storyDetail.classList.add("in-dossier"); // drives the cinematic chapter entrance
  const a = featureIndex[d.anchor];
  if (center) {
    // Opened by tapping a spot (e.g. a point on a street): stay where the tap landed.
    map.flyTo({ center, zoom: Math.max(map.getZoom(), 15), speed: 0.8 });
  } else if (a) {
    const g = a.geometry;
    if (g.type === "Point") map.flyTo({ center: g.coordinates, zoom: Math.max(map.getZoom(), 15), speed: 0.8 });
    else map.fitBounds(featureBounds(a), { padding: 70, maxZoom: 15.5, duration: 800 }); // show the whole street
  }
  showDossierChapter(0);
}

// ============================================================================
// Full-screen "library" reader — a choose-your-own-adventure deep dive.
// Cover (hero + chapter cards) → tap a chapter → swipe its beats → back / close.
// The map is hidden while reading, so photos and text get the whole screen.
// ============================================================================
const readerEl = () => document.getElementById("reader");

// A beat's film: either a YouTube embed ({youtube: "<id>"}) or a direct file
// ({url, poster?}). Archival newsreels live on YouTube; files play natively.
function videoHtml(v) {
  if (!v) return "";
  const credit = v.link ? ` · <a href="${v.link}" target="_blank" rel="noopener">source ↗</a>` : "";
  const cap = v.caption || v.link ? `<span class="caption">${v.caption || ""}${credit}</span>` : "";
  if (v.youtube) {
    return `<div class="beat-video"><iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(v.youtube)}?enablejsapi=1" title="${escAttr(v.caption || "Video")}" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>${cap}`;
  }
  return `<div class="beat-video"><video controls playsinline preload="metadata"${v.poster ? ` poster="${escAttr(v.poster)}"` : ""} src="${escAttr(v.url)}"></video></div>${cap}`;
}

// A beat's sound ({url, label?, caption?, link?}) as a native player.
function audioHtml(a) {
  if (!a) return "";
  const credit = a.link ? ` · <a href="${a.link}" target="_blank" rel="noopener">source ↗</a>` : "";
  return `<div class="beat-audio">
    <span class="beat-audio-label">♫ ${a.label || "Listen"}</span>
    <audio controls preload="none" src="${escAttr(a.url)}"></audio>
    <span class="caption">${a.caption || ""}${credit}</span>
  </div>`;
}

function openStoryMode(d) {
  activeDossier = d;
  const r = readerEl();
  r.hidden = false;
  document.body.classList.add("reading");
  renderReaderCover(d);
}

function closeStoryMode() {
  const r = readerEl();
  r.hidden = true;
  r.innerHTML = "";
  document.body.classList.remove("reading");
  activeDossier = null;
  closeStory(); // reset the sheet/detail-mode and drop back to the map
}

// "5 stories · 12 photos · film · sound" line for a chapter card.
function chapterMediaMeta(c) {
  const beats = c.beats || [];
  const photos = beats.reduce((s, b) => s + mediaList(b).length, 0);
  const parts = [`${beats.length} ${beats.length === 1 ? "story" : "stories"}`];
  if (photos) parts.push(`${photos} ${photos === 1 ? "photo" : "photos"}`);
  if (beats.some((b) => b.video)) parts.push("film");
  if (beats.some((b) => b.audio)) parts.push("sound");
  return parts.join(" · ");
}

function renderReaderCover(d) {
  const r = readerEl();
  const chaps = d.chapters.map((c, ci) => `
    <button class="rc-chap" data-ci="${ci}">
      <span class="rc-chap-img" style="background-image:url('${asset(c.image || d.cover.image)}')">
        <span class="rc-chap-n">Chapter ${ci + 1}</span>
      </span>
      <span class="rc-chap-meta">
        <span class="rc-chap-name">${c.title}</span>
        ${c.hook ? `<span class="rc-chap-hook">${inlineMd(c.hook)}</span>` : ""}
        <span class="rc-chap-count">${chapterMediaMeta(c)}<span class="rc-chap-go">Read ›</span></span>
      </span>
    </button>`).join("");
  r.innerHTML = `
    <div class="reader-cover">
      <button class="reader-close" aria-label="Close">×</button>
      <div class="rc-hero" style="background-image:url('${asset(d.cover.image)}')">
        <div class="rc-hero-grad"></div>
        <div class="rc-hero-text"><h1 class="rc-title">${d.title}</h1></div>
      </div>
      <div class="rc-scroll">
        ${d.cover.hook ? `<p class="rc-hook">${inlineMd(d.cover.hook)}</p>` : ""}
        <div class="rc-toc">Chapters</div>
        <div class="rc-chapters">${chaps}</div>
      </div>
    </div>`;
  r.scrollTop = 0;
  r.querySelector(".reader-close").addEventListener("click", closeStoryMode);
  r.querySelectorAll(".rc-chap").forEach((b) =>
    b.addEventListener("click", () => openReaderChapter(d, +b.dataset.ci)));
}

function openReaderChapter(d, ci) {
  const c = d.chapters[ci];
  const beats = c.beats || [];
  const r = readerEl();
  let bi = 0, x0 = null, y0 = null;

  // Every beat mounts once into a horizontal track; paging slides the track,
  // so images load a single time and never re-fetch as you move around.
  // The lead/words/film panes are display:contents on phones (flat flow) and
  // become a media-left / words-right split on wide screens.
  const panels = beats.map((b) => {
    const lead = mediaHtml(mediaList(b));
    const film = videoHtml(b.video);
    return `
    <div class="rch-scroll">
      <div class="beat${lead || film ? "" : " beat-textonly"}">
        <div class="beat-lead">${lead}</div>
        <div class="beat-words">
          ${b.heading ? `<h2 class="beat-h">${inlineMd(b.heading)}</h2>` : ""}
          ${asArray(b.body).map((x) => `<p class="beat-p">${inlineMd(x)}</p>`).join("")}
          ${audioHtml(b.audio)}
        </div>
        <div class="beat-film">${film}</div>
      </div>
    </div>`;
  }).join("");
  r.innerHTML = `
    <div class="reader-chapter">
      <div class="rch-top">
        <button class="reader-back" aria-label="Back to chapters">‹ Chapters</button>
        <span class="rch-count"></span>
        <button class="reader-close" aria-label="Close">×</button>
      </div>
      <div class="rch-viewport"><div class="rch-track">${panels}</div></div>
      <div class="rch-nav">
        <button class="rb-prev">‹ Back</button>
        <div class="rb-dots">${beats.map(() => `<span class="rb-dot"></span>`).join("")}</div>
        <button class="rb-next">Next ›</button>
      </div>
    </div>`;
  wireCarousels(r);
  // Off-screen panels sit outside the viewport, so lazy images would only
  // start fetching mid-swipe — load everything in the chapter up front.
  r.querySelectorAll(".rch-track img").forEach((im) => { im.loading = "eager"; });
  const track = r.querySelector(".rch-track");
  const scrolls = [...r.querySelectorAll(".rch-scroll")];
  const dots = [...r.querySelectorAll(".rb-dot")];
  const count = r.querySelector(".rch-count");
  const prevBtn = r.querySelector(".rb-prev");
  const nextBtn = r.querySelector(".rb-next");
  const nextCh = ci < d.chapters.length - 1 ? d.chapters[ci + 1] : null;

  function showBeat(n) {
    bi = Math.max(0, Math.min(n, beats.length - 1));
    track.style.transform = `translateX(${-bi * 100}%)`;
    dots.forEach((dot, k) => dot.classList.toggle("on", k === bi));
    count.textContent = `${c.title} · ${bi + 1}/${beats.length}`;
    prevBtn.disabled = bi === 0;
    // The last beat flows straight into the next chapter (the cover is always
    // one tap away via "‹ Chapters"); only the final chapter returns to it.
    nextBtn.textContent = bi === beats.length - 1
      ? (nextCh ? `Next: ${nextCh.title} ›` : "Chapters ›")
      : "Next ›";
    // Silence the beats we're leaving (all panels stay mounted).
    scrolls.forEach((s, k) => {
      if (k === bi) return;
      s.querySelectorAll("video, audio").forEach((m) => m.pause());
      s.querySelectorAll(".beat-video iframe").forEach((f) => {
        try { f.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', "*"); } catch (e) {}
      });
    });
    // Replay the cinematic entrance on the beat that just arrived.
    scrolls.forEach((s, k) => { if (k !== bi) s.firstElementChild.classList.remove("beat-in"); });
    const active = scrolls[bi].firstElementChild;
    active.classList.remove("beat-in");
    void active.offsetWidth; // restart the animation on revisits
    active.classList.add("beat-in");
    scrolls[bi].scrollTop = 0;
  }

  // Forward past the last beat rolls into the next chapter.
  const advance = () => {
    if (bi < beats.length - 1) showBeat(bi + 1);
    else if (nextCh) openReaderChapter(d, ci + 1);
    else renderReaderCover(d);
  };
  r.querySelector(".reader-back").addEventListener("click", () => renderReaderCover(d));
  r.querySelector(".reader-close").addEventListener("click", closeStoryMode);
  prevBtn.addEventListener("click", () => { if (bi > 0) showBeat(bi - 1); });
  nextBtn.addEventListener("click", advance);
  // horizontal swipe advances beats (vertical scroll still works for long text)
  const vp = r.querySelector(".rch-viewport");
  vp.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  vp.addEventListener("touchend", (e) => {
    if (x0 == null) return;
    if (e.target.closest(".carousel")) { x0 = null; return; } // the carousel owns its own swipes
    const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) advance();
      else if (bi > 0) showBeat(bi - 1);
    }
    x0 = null;
  });
  showBeat(0);
}

const TOUR_KIND_LABEL = { time: "Virtual · through time", theme: "Virtual · by theme", walk: "Walking tour" };

function eraName(y) {
  y = +y;
  if (!y) return "";
  if (y < 1840) return "Colonial";
  if (y < 1901) return "Victorian";
  if (y < 1920) return "Federation";
  return "Modern";
}

// Hero image for a tour card: the first stop that has one.
function tourHero(tour) {
  for (const s of tour.stops) {
    const f = featureIndex[s.ref];
    if (f && f.properties.image) return f.properties.image;
  }
  return null;
}

// A tiny normalised route-shape thumbnail so each card previews its path.
function routeSvg(tour) {
  const pts = tour.stops.map((s) => featureIndex[s.ref]).filter(Boolean).map((f) => f.geometry.coordinates);
  if (pts.length < 2) return "";
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const minx = Math.min(...xs), maxx = Math.max(...xs), miny = Math.min(...ys), maxy = Math.max(...ys);
  const sx = maxx - minx, sy = maxy - miny, s = Math.max(sx, sy) || 1;
  const nx = (x) => 8 + ((x - minx) / s) * 48 + (48 - (sx / s) * 48) / 2;
  const ny = (y) => 8 + ((maxy - y) / s) * 48 + (48 - (sy / s) * 48) / 2; // flip: north up
  const d = pts.map((p, i) => (i ? "L" : "M") + nx(p[0]).toFixed(1) + " " + ny(p[1]).toFixed(1)).join(" ");
  const dots = pts.map((p) => `<circle cx="${nx(p[0]).toFixed(1)}" cy="${ny(p[1]).toFixed(1)}" r="1.6"/>`).join("");
  return `<svg class="tc-route" viewBox="0 0 64 64" preserveAspectRatio="xMidYMid meet"><path d="${d}" fill="none" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/>${dots}</svg>`;
}

function tourCard(tour) {
  const li = document.createElement("li");
  li.className = "tour-card";
  li.dataset.id = tour.id;
  li.dataset.kind = tour.kind || "theme";
  const hero = tourHero(tour);
  const era = tour.kind === "time" ? eraName(tour.year) : "";
  const mins = Math.max(5, Math.round((tour.stops.length * 4) / 5) * 5);
  const meta = [TOUR_KIND_LABEL[tour.kind] || "Tour", `${tour.stops.length} stops`, `~${mins} min`]
    .concat(era ? [era] : [])
    .join(" · ");
  li.innerHTML = `
    <div class="tc-thumb${hero ? "" : " noimg"}"${hero ? ` style="background-image:url('${hero}')"` : ""}>${routeSvg(tour)}</div>
    <div class="tc-body">
      <strong>${tour.title}</strong>
      <span class="tc-meta">${meta}</span>
      <span class="tc-blurb">${tour.blurb}</span>
    </div>`;
  li.addEventListener("click", () => startTour(tour));
  return li;
}

function buildTourFilter(list, kindsPresent) {
  const bar = document.createElement("div");
  bar.className = "tour-filter";
  const opts = [["all", "All"], ["walk", "Walking"], ["time", "Virtual · time"], ["theme", "Virtual · themes"]]
    .filter(([k]) => k === "all" || kindsPresent.has(k));
  bar.innerHTML = opts
    .map(([k, l], i) => `<button class="tf-chip${i === 0 ? " active" : ""}" data-kind="${k}">${l}</button>`)
    .join("");
  bar.addEventListener("click", (e) => {
    const b = e.target.closest(".tf-chip");
    if (!b) return;
    bar.querySelectorAll(".tf-chip").forEach((c) => c.classList.toggle("active", c === b));
    const k = b.dataset.kind;
    list.querySelectorAll(".tour-card").forEach((card) => {
      card.style.display = k === "all" || card.dataset.kind === k ? "" : "none";
    });
  });
  return bar;
}

// ============================================================================
// TOUR LAUNCHER — the tour-first landing screen. Opens over the map on load;
// "Explore the map freely" (or the ✕) drops into free-browse, and the ◆ Tours
// home button brings it back. Tours group by neighbourhood (where you can walk)
// or by theme (what you love). Metadata comes from pipeline/tour_metadata.py.
// ============================================================================
// Neighbourhoods ordered harbour → east → north → west; armchair tours (no
// neighbourhood) fall into a trailing "Across Sydney" group so nothing hides.
const NB_ORDER = [
  "City & The Rocks", "City & The Domain", "The Harbour", "Eastern Harbour",
  "Eastern Beaches", "Botany Bay", "Manly & the North", "Parramatta & the West",
];
const DIFF_LABEL = { easy: "Easy", moderate: "Moderate", hard: "Challenging" };
const FEATURE_LABEL = { stairs: "Stairs", hills: "Hills", cliffs: "Cliffs", "step-free": "Step-free", sand: "Sand" };
let launcherTab = "neighbourhood";

// The at-a-glance facts row on a card: real walks lead with distance/difficulty
// and the "stairs? hills?" cues; armchair tours read as a reading experience.
function launcherMeta(t) {
  if (t.virtual) {
    return `<span class="lc-chip virtual">Virtual</span>
      <span class="lc-fact">${t.stops.length} stops</span>
      <span class="lc-fact">~${t.duration_min} min read</span>
      ${t.theme ? `<span class="lc-fact">${t.theme}</span>` : ""}`;
  }
  const feats = (t.features || []).map((f) => `<span class="lc-feat">${FEATURE_LABEL[f] || f}</span>`).join("");
  return `<span class="lc-fact">${t.distance_km} km</span>
    <span class="lc-fact">~${t.duration_min} min</span>
    <span class="lc-fact">${t.stops.length} stops</span>
    <span class="lc-diff ${t.difficulty}">${DIFF_LABEL[t.difficulty] || t.difficulty}</span>
    ${feats}`;
}

function launcherCard(t) {
  const hero = tourHero(t);
  const walk = !t.virtual;
  return `<button class="lcard${walk ? " walk" : ""}" type="button" data-id="${t.id}">
    <div class="lc-thumb${hero ? "" : " noimg"}"${hero ? ` style="background-image:url('${hero}')"` : ""}>
      <span class="lc-badge">${walk ? "Walk" : "Armchair"}</span>
      ${routeSvg(t)}
    </div>
    <div class="lc-body">
      <strong class="lc-title">${t.title}</strong>
      <span class="lc-teaser">${t.teaser || t.blurb || ""}</span>
      <span class="lc-meta">${launcherMeta(t)}</span>
    </div>
  </button>`;
}

// Build the grouped shelves for the active tab.
function launcherGroups() {
  if (launcherTab === "theme") {
    return THEMES
      .map((th) => ({ title: th, tours: allTours.filter((t) => t.theme === th) }))
      .filter((g) => g.tours.length);
  }
  const groups = NB_ORDER
    .map((nb) => ({ title: nb, tours: allTours.filter((t) => t.neighbourhood === nb) }))
    .filter((g) => g.tours.length);
  const armchair = allTours.filter((t) => !t.neighbourhood);
  if (armchair.length) groups.push({ title: "Across Sydney", sub: "armchair tours", tours: armchair });
  return groups;
}

function renderLauncher() {
  const body = document.getElementById("lnr-body");
  if (!body) return;
  body.innerHTML = launcherGroups().map((g) => `
    <section class="lnr-group">
      <h2 class="lnr-gh">${g.title}${g.sub ? `<span class="lnr-gsub">${g.sub}</span>` : ""}</h2>
      <div class="lnr-cards">${g.tours.map(launcherCard).join("")}</div>
    </section>`).join("");
  body.querySelectorAll(".lcard").forEach((c) =>
    c.addEventListener("click", () => {
      const t = allTours.find((x) => x.id === c.dataset.id);
      if (t) { hideLauncher(); startTour(t); }
    }));
}

// One-time scaffold + wiring of the launcher chrome.
function buildLauncher() {
  const el = document.getElementById("launcher");
  if (!el) return;
  el.innerHTML = `
    <div class="lnr-head">
      <div class="lnr-title">
        <h1>Sydney, Layered</h1>
        <p class="lnr-tag">Choose a walk and let the city tell its story — or explore the map on your own.</p>
      </div>
      <div class="lnr-tabs" role="tablist">
        <button class="lnr-tab active" type="button" data-tab="neighbourhood">By neighbourhood</button>
        <button class="lnr-tab" type="button" data-tab="theme">By theme</button>
      </div>
    </div>
    <div id="lnr-body" class="lnr-body"></div>
    <button class="lnr-explore" type="button">Explore the map freely →</button>`;
  el.querySelectorAll(".lnr-tab").forEach((tab) =>
    tab.addEventListener("click", () => {
      launcherTab = tab.dataset.tab;
      el.querySelectorAll(".lnr-tab").forEach((x) => x.classList.toggle("active", x === tab));
      renderLauncher();
      document.getElementById("lnr-body").scrollTop = 0;
    }));
  el.querySelector(".lnr-explore").addEventListener("click", hideLauncher);
  const home = document.getElementById("home-btn");
  if (home) home.addEventListener("click", showLauncher);
  renderLauncher();
}

function showLauncher() {
  const el = document.getElementById("launcher");
  if (!el) return;
  renderLauncher();
  el.hidden = false;
  void el.offsetHeight; // reflow so the fade-in runs
  el.classList.add("show");
  document.body.classList.add("launcher-open");
  if (typeof map !== "undefined") map.resize(); // sidebar hidden behind the picker
}
function hideLauncher() {
  const el = document.getElementById("launcher");
  if (!el) return;
  el.classList.remove("show");
  document.body.classList.remove("launcher-open");
  if (typeof map !== "undefined") map.resize(); // free map: sidebar returns unless a tour is active
  setTimeout(() => { if (!document.body.classList.contains("launcher-open")) el.hidden = true; }, 400);
}

// --- Water awareness for generated walking routes ---
// web/data/water.geojson holds the major bodies (coarse, ~250 m shoreline
// error, built by pipeline/lint_tours.py). Loaded lazily on first use.
let waterBodies = null; // [{bbox, geometry}]
async function ensureWater() {
  if (waterBodies) return;
  try {
    const gj = await fetchJSON("data/water.geojson?v=20260706a");
    waterBodies = gj.features.map((f) => {
      const ring = f.geometry.coordinates[0];
      let m = [Infinity, Infinity], M = [-Infinity, -Infinity];
      for (const [x, y] of ring) { if (x < m[0]) m[0] = x; if (y < m[1]) m[1] = y; if (x > M[0]) M[0] = x; if (y > M[1]) M[1] = y; }
      return { bbox: [...m, ...M], geometry: f.geometry };
    });
  } catch (e) {
    console.warn("water.geojson unavailable — walking legs won't be water-checked", e);
    waterBodies = [];
  }
}
// A leg "swims" when a sustained INTERIOR run of its samples (3+) lands in
// big water. Wet runs touching either end don't count: pins legitimately sit
// on wharves or commemorate the water itself, and that's not a crossing.
function legCrossesWater(a, b) {
  if (!waterBodies || !waterBodies.length) return false;
  const N = 12;
  const flags = [];
  for (let k = 2; k < N - 1; k++) {
    const t = k / N;
    const pt = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    flags.push(waterBodies.some((w) =>
      pt[0] >= w.bbox[0] && pt[0] <= w.bbox[2] && pt[1] >= w.bbox[1] && pt[1] <= w.bbox[3] &&
      pointInGeometry(pt, w.geometry)));
  }
  while (flags.length && flags[0]) flags.shift();
  while (flags.length && flags[flags.length - 1]) flags.pop();
  let run = 0;
  for (const wet of flags) {
    run = wet ? run + 1 : 0;
    if (run >= 3) return true;
  }
  return false;
}

// Fetch a real pedestrian path through the given points (FOSSGIS OSRM, foot
// profile — the same router pipeline/route_walks.py uses). Null on any failure;
// the tour then falls back to straight dotted legs.
async function fetchWalkPath(points) {
  const locs = points.map((c) => `${c[0].toFixed(6)},${c[1].toFixed(6)}`).join(";");
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const r = await fetch(`https://routing.openstreetmap.de/routed-foot/route/v1/foot/${locs}?overview=full&geometries=geojson&steps=false`, { signal: ctrl.signal });
    const d = await r.json();
    if (d.code === "Ok" && d.routes && d.routes[0]) {
      return { path: d.routes[0].geometry.coordinates, walk_m: Math.round(d.routes[0].distance) };
    }
  } catch (e) { /* offline or router down — straight legs still work */ }
  finally { clearTimeout(timer); }
  return null;
}

// Assemble an ephemeral tour from features matching interests (+ optional era).
// Without opts.start: the classic armchair chain from the northernmost match.
// With opts.start [lng,lat]: a WALKING tour — stops within reach, legs capped,
// total capped by budget, no leg swimming across the harbour, 2-opt untangled,
// a dash of randomness so no two rolls match, and a real foot path when the
// router answers.
async function buildDynamicTour(theme, era, opts = {}) {
  const { start = null, maxLegM = 450, budgetM = 2500, maxStops = 10, radiusM = 1500 } = opts;
  const wanted = opts.themes && opts.themes.length ? opts.themes : (theme ? [theme] : null);
  const matches = [];
  for (const key in featureIndex) {
    const f = featureIndex[key];
    if (!f.geometry || f.geometry.type !== "Point") continue;
    if (absorbedIds.has(key.split(":")[1])) continue; // told inside a landmark's chapters
    const p = f.properties;
    const themes = Array.isArray(p.theme) ? p.theme : p.theme ? [p.theme] : [];
    if (wanted && !wanted.some((w) => themes.includes(w))) continue;
    if (era && p.era !== era) continue;
    matches.push(key);
  }
  const coord = (k) => featureIndex[k].geometry.coordinates;
  let ordered;

  if (!start) {
    if (matches.length < 2) return null;
    // armchair: northernmost start, nearest-to-nearest chain
    let first = matches[0];
    for (const k of matches) if (coord(k)[1] > coord(first)[1]) first = k;
    ordered = [first];
    const remaining = new Set(matches);
    remaining.delete(first);
    while (remaining.size && ordered.length < maxStops) {
      const last = coord(ordered[ordered.length - 1]);
      let best = null, bestd = Infinity;
      for (const k of remaining) {
        const d = metersBetween(last, coord(k));
        if (d < bestd) { bestd = d; best = k; }
      }
      ordered.push(best);
      remaining.delete(best);
    }
  } else {
    await ensureWater();
    const near = matches.filter((k) => metersBetween(start, coord(k)) <= radiusM);
    // prefer significant places when there's plenty of choice
    near.sort((a, b) => (featureIndex[a].properties.rank || 3) - (featureIndex[b].properties.rank || 3));
    ordered = [];
    const remaining = new Set(near);
    let cur = start, total = 0;
    while (remaining.size && ordered.length < maxStops) {
      // all legal next hops, nearest first
      const cands = [];
      for (const k of remaining) {
        const d = metersBetween(cur, coord(k));
        if (d <= maxLegM && !legCrossesWater(cur, coord(k))) cands.push([k, d]);
      }
      cands.sort((a, b) => a[1] - b[1]);
      if (!cands.length) break;
      // mostly take the nearest, sometimes the second or third: variety
      const roll = Math.random();
      const pick = cands[roll < 0.6 || cands.length === 1 ? 0 : roll < 0.88 || cands.length === 2 ? 1 : 2];
      if (total + pick[1] > budgetM) break;
      ordered.push(pick[0]);
      total += pick[1];
      cur = coord(pick[0]);
      remaining.delete(pick[0]);
    }
    if (ordered.length < 3) return null;
    // 2-opt untangle (start stays the origin); keep a swap only if every new
    // leg still obeys the cap and stays dry
    const legLen = (arr) => arr.reduce((s, k, i) => s + metersBetween(i ? coord(arr[i - 1]) : start, coord(k)), 0);
    const valid = (arr) => arr.every((k, i) => {
      const from = i ? coord(arr[i - 1]) : start;
      return metersBetween(from, coord(k)) <= maxLegM && !legCrossesWater(from, coord(k));
    });
    let improved = true;
    while (improved) {
      improved = false;
      for (let i = 0; i < ordered.length - 1; i++) {
        for (let j = i + 1; j < ordered.length; j++) {
          const cand = ordered.slice(0, i).concat(ordered.slice(i, j + 1).reverse(), ordered.slice(j + 1));
          if (legLen(cand) + 1 < legLen(ordered) && valid(cand)) { ordered = cand; improved = true; }
        }
      }
    }
  }

  const stops = ordered.map((key) => ({ ref: key, note: featureIndex[key].properties.summary || "" }));
  const eraLabel = era ? era.replace(" Sydney", "") : "";
  const what = wanted && wanted.length === 1 ? wanted[0].toLowerCase() + " places" : "places";
  if (start) {
    const routed = await fetchWalkPath([start, ...ordered.map(coord)]);
    const meters = routed ? routed.walk_m
      : ordered.reduce((s, k, i) => s + metersBetween(i ? coord(ordered[i - 1]) : start, coord(k)), 0);
    const title = wanted && wanted.length === 1 ? wanted[0]
      : wanted && wanted.length ? "Your interests, nearby" : "Around you";
    return {
      id: "dynamic",
      title: title + (eraLabel ? " · " + eraLabel : ""),
      blurb: `A walking route from where you are through ${stops.length} ${what}, about ${(meters / 1000).toFixed(1)} km on foot.`,
      kind: "walk",
      stops,
      ...(routed ? { path: [start, ...routed.path], walk_m: routed.walk_m } : {}),
    };
  }
  return {
    id: "dynamic",
    title: theme + (eraLabel ? " · " + eraLabel : ""),
    blurb: `A generated route through ${stops.length} ${what}${eraLabel ? " of " + eraLabel.toLowerCase() + " Sydney" : ""}, linked nearest-to-nearest.`,
    kind: "theme",
    stops,
  };
}

function buildTourBuilder() {
  const wrap = document.createElement("div");
  wrap.className = "tour-builder";
  const eras = [["", "Any era"], ["Colonial Sydney", "Colonial"], ["Victorian Sydney", "Victorian"], ["Federation Sydney", "Federation"], ["Modern Sydney", "Modern"]];
  wrap.innerHTML = `
    <button class="tb-toggle">✦ Build a tour</button>
    <div class="tb-form" hidden>
      <label>Theme<select class="tb-theme">${THEMES.map((t) => `<option value="${t}">${t}</option>`).join("")}</select></label>
      <label>Era<select class="tb-era">${eras.map(([v, l]) => `<option value="${v}">${l}</option>`).join("")}</select></label>
      <button class="tb-go">Generate route ›</button>
      <p class="tb-msg"></p>
    </div>`;
  const form = wrap.querySelector(".tb-form");
  wrap.querySelector(".tb-toggle").addEventListener("click", () => { form.hidden = !form.hidden; });
  wrap.querySelector(".tb-go").addEventListener("click", async () => {
    const theme = wrap.querySelector(".tb-theme").value;
    const era = wrap.querySelector(".tb-era").value;
    const tour = await buildDynamicTour(theme, era);
    const msg = wrap.querySelector(".tb-msg");
    if (!tour) { msg.textContent = "Not enough places match — try a broader theme or any era."; return; }
    msg.textContent = "";
    startTour(tour);
  });
  return wrap;
}

async function loadTours() {
  const tours = await fetchJSON("data/tours.json?v=" + Date.now());
  const list = document.getElementById("tour-list");
  const valid = tours.filter((t) => {
    const missing = t.stops.filter((s) => !featureIndex[s.ref]);
    if (missing.length) console.warn(`Tour ${t.id} skipped — missing refs:`, missing.map((s) => s.ref));
    return !missing.length;
  });
  // order: real walks first (the primary use), then the virtual shelves
  const order = { walk: 0, time: 1, theme: 2 };
  valid.sort((a, b) => (order[a.kind] ?? 1) - (order[b.kind] ?? 1));
  const kindsPresent = new Set(valid.map((t) => t.kind || "theme"));
  list.parentNode.insertBefore(buildTourBuilder(), list);
  list.parentNode.insertBefore(buildTourFilter(list, kindsPresent), list);
  for (const tour of valid) list.appendChild(tourCard(tour));
  // Cross-link: index which tours each feature appears in.
  allTours = valid;
  for (const t of allTours) for (const s of t.stops) (tourMembership[s.ref] ||= []).push(t.id);
}

function showStory(feature) {
  const p = feature.properties;
  const anchor = "story:" + p.id;
  // Free-browse: a deep-dive pin shows a photo-first card whose CTA opens the
  // chapters. In a tour/dossier we keep the full inline card (no nested dive).
  const hasDeep = !activeDossier && !activeTour && !!dossiersByAnchor[anchor];
  const coords = feature.geometry.coordinates;
  const period = periodOf(p);

  document.querySelectorAll("#story-list li, #building-list li, #people-list li").forEach((li) => {
    li.classList.toggle("active", li.dataset.id === p.id && li.closest("#story-list") !== null);
  });

  openDetail(`
    ${mediaHtml(mediaList(p))}
    <h3>${p.title}</h3>
    ${hasDeep
      ? `<p class="hook">${inlineMd(hookOf(p))}</p>${deepDiveCta(anchor)}`
      : asArray(p.body).map((x) => `<p>${inlineMd(x)}</p>`).join("")}
    ${detailPapers(p)}
    ${relatedHtml(anchor)}
    <span class="source">Sources: ${p.source}</span>`);

  if (!suppressFly) flyToFeature(feature);
  else if (mqMobile.matches) setSheet(true); // already positioned (tour/dossier/hop) — open now
}

function showBuilding(feature) {
  const p = feature.properties;
  const anchor = "building:" + p.id;
  const hasDeep = !activeDossier && !activeTour && !!dossiersByAnchor[anchor];
  const coords = feature.geometry.coordinates;
  const period = periodOf(p);
  // Nested props arrive as JSON strings from map click events, as arrays from raw GeoJSON.
  const timeline = typeof p.timeline === "string" ? JSON.parse(p.timeline) : (p.timeline || []);
  const stories = typeof p.stories === "string" ? JSON.parse(p.stories) : (p.stories || []);

  document.querySelectorAll("#story-list li, #building-list li, #people-list li").forEach((li) => {
    li.classList.toggle("active", li.dataset.id === p.id && li.closest("#building-list") !== null);
  });

  const timelineHtml = timeline
    .map((t) => `<li><span class="tl-year">${t.year}</span><span>${t.event}</span></li>`)
    .join("");
  const storiesHtml = stories.map((s) => `<p class="bstory">${inlineMd(s)}</p>`).join("");

  openDetail(`
    ${mediaHtml(mediaList(p))}
    <h3>${p.name}</h3>
    ${hasDeep
      ? `<p class="hook">${inlineMd(hookOf(p))}</p>${deepDiveCta(anchor)}`
      : `<ul class="timeline">${timelineHtml}</ul>${storiesHtml}`}
    ${detailPapers(p)}
    ${relatedHtml(anchor)}
    <span class="source">Sources: ${p.source}</span>`);

  if (!suppressFly) flyToFeature(feature);
  else if (mqMobile.matches) setSheet(true); // already positioned (tour/dossier/hop) — open now
}

function showStreet(feature) {
  const p = feature.properties;
  const anchor = "street:" + p.id;
  const hasDeep = !activeDossier && !activeTour && !!dossiersByAnchor[anchor];
  const timeline = typeof p.timeline === "string" ? JSON.parse(p.timeline) : (p.timeline || []);
  document.querySelectorAll("#story-list li, #building-list li, #people-list li, #street-list li").forEach((li) => {
    li.classList.toggle("active", li.dataset.id === p.id && li.closest("#street-list") !== null);
  });
  const timelineHtml = timeline
    .map((t) => `<li><span class="tl-year">${t.year}</span><span>${t.event}</span></li>`)
    .join("");
  openDetail(`
    ${mediaHtml(mediaList(p))}
    <h3>${p.name}</h3>
    <div class="uses"><span><strong>Street</strong></span></div>
    ${hasDeep
      ? `<p class="hook">${inlineMd(hookOf(p))}</p>${deepDiveCta(anchor)}`
      : `<ul class="timeline">${timelineHtml}</ul>`}
    ${detailPapers(p)}
    ${relatedHtml(anchor)}
    <span class="source">Sources: ${p.source}</span>`);
  if (!suppressFly) map.fitBounds(featureBounds(feature), { padding: 70, maxZoom: 15.5, duration: 800 });
  else if (mqMobile.matches) setSheet(true);
}

async function loadStreets() {
  const streets = await fetchJSON("data/streets.geojson?v=" + Date.now());
  for (const f of streets.features) {
    featureIndex[`street:${f.properties.id}`] = f;
    f.properties.appear = parseInt(f.properties.built) || 1800;
  }
  map.addSource("streets", { type: "geojson", data: streets });
  // Drawn beneath the pin layers so pins stay tappable on top.
  map.addLayer({
    id: "street-lines",
    type: "line",
    source: "streets",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": periodColorExpression,
      "line-width": ["interpolate", ["linear"], ["zoom"], 10, 1.2, 13, 3.5, 16, 6],
      "line-opacity": ["interpolate", ["linear"], ["zoom"], 10, 0.35, 13, 0.75, 15, 0.85],
    },
  }, map.getLayer("story-points") ? "story-points" : undefined);
  map.on("mouseenter", "street-lines", (e) => {
    if (mqTouch.matches) return;
    map.getCanvas().style.cursor = "pointer";
    if (hoverTip) hoverTip.remove();
    hoverTip = new maplibregl.Popup({ offset: 8, closeButton: false, closeOnClick: false, className: "hover-tip" })
      .setLngLat(e.lngLat)
      .setHTML(`<strong>${e.features[0].properties.name}</strong><br/>${e.features[0].properties.summary}`)
      .addTo(map);
  });
  map.on("mouseleave", "street-lines", () => {
    map.getCanvas().style.cursor = "";
    if (hoverTip) hoverTip.remove();
    hoverTip = null;
  });
  const list = document.getElementById("street-list");
  if (list) {
    for (const f of [...streets.features].sort((a, b) => a.properties.name.localeCompare(b.properties.name))) {
      const p = f.properties;
      const li = document.createElement("li");
      li.dataset.id = p.id; li.dataset.era = p.era; li.dataset.theme = p.theme;
      li.dataset.periods = (p.periods || []).join(" ");
      li.innerHTML = `<span class="year" style="color:${periodOf(p).color}">${p.built || ""}</span>${p.name}`;
      li.addEventListener("click", () => openFromList(showStreet, f));
      list.appendChild(li);
    }
  }
}

async function loadStories() {
  const stories = await fetchJSON("data/stories.geojson?v=" + Date.now());
  for (const f of stories.features) {
    featureIndex[`story:${f.properties.id}`] = f;
    f.properties.appear = f.properties.year;
  }

  map.addSource("stories", { type: "geojson", data: stories });
  map.addLayer({
    id: "story-points",
    type: "circle",
    source: "stories",
    paint: {
      "circle-radius": PIN_RADIUS,
      "circle-color": periodColorExpression,
      "circle-opacity": 1,
      "circle-stroke-width": ["interpolate", ["linear"], ["zoom"], 10, 1.2, 13, 1.4, 16, 2],
      "circle-stroke-color": "#f7f3ec",
      "circle-stroke-opacity": 1,
    },
  });

  map.on("mouseenter", "story-points", (e) => {
    if (mqTouch.matches) return;
    map.getCanvas().style.cursor = "pointer";
    const f = e.features[0];
    if (hoverTip) hoverTip.remove();
    hoverTip = new maplibregl.Popup({
      offset: 12,
      closeButton: false,
      closeOnClick: false,
      className: "hover-tip",
    })
      .setLngLat(f.geometry.coordinates)
      .setHTML(
        `<strong>${f.properties.title}</strong> (${f.properties.year_label || f.properties.year})<br/>${f.properties.summary}`
      )
      .addTo(map);
  });
  map.on("mouseleave", "story-points", () => {
    map.getCanvas().style.cursor = "";
    if (hoverTip) hoverTip.remove();
    hoverTip = null;
  });

  const list = document.getElementById("story-list");
  for (const period of PERIODS) {
    if (period.id === "now") continue;
    const features = stories.features
      .filter((f) => (f.properties.periods || [])[0] === period.id)
      .sort((a, b) => a.properties.year - b.properties.year);
    if (!features.length) continue;

    const group = document.createElement("div");
    group.className = "era-group";
    group.dataset.id = period.id;
    group.innerHTML = `<h3 style="border-color:${period.color}">${period.label} <span>${period.range || ""}</span></h3>`;
    const ul = document.createElement("ul");
    for (const feature of features) {
      const li = document.createElement("li");
      li.dataset.id = feature.properties.id;
      li.dataset.era = feature.properties.era;
      li.dataset.theme = feature.properties.theme;
      li.dataset.periods = (feature.properties.periods || []).join(" ");
      li.innerHTML = `<span class="year" style="color:${period.color}">${feature.properties.year_label || feature.properties.year}</span>${feature.properties.title}`;
      li.addEventListener("click", () => openFromList(showStory, feature));
      ul.appendChild(li);
    }
    group.appendChild(ul);
    list.appendChild(group);
  }
}

async function loadBuildings() {
  const buildings = await fetchJSON("data/buildings.geojson?v=" + Date.now());
  for (const f of buildings.features) {
    featureIndex[`building:${f.properties.id}`] = f;
    f.properties.appear = parseInt(f.properties.built);
  }

  map.addSource("buildings", { type: "geojson", data: buildings });
  // Hollow rings with era-coloured strokes — distinct from the solid story dots.
  map.addLayer({
    id: "building-points",
    type: "circle",
    source: "buildings",
    paint: {
      "circle-radius": PIN_RADIUS,
      "circle-color": "#f7f3ec",
      "circle-opacity": 1,
      "circle-stroke-width": ["interpolate", ["linear"], ["zoom"], 10, 1.6, 13, 2, 16, 3],
      "circle-stroke-color": periodColorExpression,
      "circle-stroke-opacity": 1,
    },
  });

  map.on("mouseenter", "building-points", (e) => {
    if (mqTouch.matches) return;
    map.getCanvas().style.cursor = "pointer";
    const f = e.features[0];
    if (hoverTip) hoverTip.remove();
    hoverTip = new maplibregl.Popup({
      offset: 12,
      closeButton: false,
      closeOnClick: false,
      className: "hover-tip",
    })
      .setLngLat(f.geometry.coordinates)
      .setHTML(
        `<strong>${f.properties.name}</strong> (built ${f.properties.built})<br/>${f.properties.summary}`
      )
      .addTo(map);
  });
  map.on("mouseleave", "building-points", () => {
    map.getCanvas().style.cursor = "";
    if (hoverTip) hoverTip.remove();
    hoverTip = null;
  });

  const list = document.getElementById("building-list");
  const byYear = [...buildings.features].sort(
    (a, b) => parseInt(a.properties.built) - parseInt(b.properties.built)
  );
  for (const feature of byYear) {
    const period = periodOf(feature.properties);
    const li = document.createElement("li");
    li.dataset.id = feature.properties.id;
    li.dataset.era = feature.properties.era;
    li.dataset.theme = feature.properties.theme;
    li.dataset.periods = (feature.properties.periods || []).join(" ");
    li.innerHTML = `<span class="year" style="color:${period.color}">${feature.properties.built}</span>${feature.properties.name}`;
    li.addEventListener("click", () => openFromList(showBuilding, feature));
    list.appendChild(li);
  }
}

function showPerson(feature) {
  const p = feature.properties;
  const anchor = "person:" + p.id;
  const hasDeep = !activeDossier && !activeTour && !!dossiersByAnchor[anchor];
  const coords = feature.geometry.coordinates;
  const period = periodOf(p);
  const body =
    typeof p.body === "string"
      ? p.body.trim().startsWith("[")
        ? JSON.parse(p.body)
        : [p.body]
      : p.body;

  document.querySelectorAll("#story-list li, #building-list li, #people-list li").forEach((li) => {
    li.classList.toggle("active", li.dataset.id === p.id && li.closest("#people-list") !== null);
  });

  openDetail(`
    ${mediaHtml(mediaList(p))}
    <h3>${p.name}</h3>
    <div class="uses"><span><strong>Place</strong> ${p.place}</span></div>
    ${hasDeep
      ? `<p class="hook">${inlineMd(hookOf(p))}</p>${deepDiveCta(anchor)}`
      : body.map((para) => `<p>${inlineMd(para)}</p>`).join("")}
    ${detailPapers(p)}
    ${relatedHtml(anchor)}
    <span class="source">Sources: ${p.source}</span>`);

  if (!suppressFly) flyToFeature(feature);
  else if (mqMobile.matches) setSheet(true); // already positioned (tour/dossier/hop) — open now
}

async function loadPeople() {
  const people = await fetchJSON("data/people.geojson?v=" + Date.now());
  for (const f of people.features) {
    featureIndex[`person:${f.properties.id}`] = f;
    // People appear in young adulthood, not at birth.
    const born = parseInt((f.properties.lived.match(/\d{4}/) || ["1900"])[0]);
    f.properties.appear = born + 20;
  }

  map.addSource("people", { type: "geojson", data: people });
  // Dark dots with era-coloured rings — people sit visually between
  // solid story dots and hollow building rings.
  map.addLayer({
    id: "people-points",
    type: "circle",
    source: "people",
    paint: {
      "circle-radius": PIN_RADIUS,
      "circle-color": "#2b2118",
      "circle-opacity": 1,
      "circle-stroke-width": ["interpolate", ["linear"], ["zoom"], 10, 1.3, 13, 1.6, 16, 2.5],
      "circle-stroke-color": periodColorExpression,
      "circle-stroke-opacity": 1,
    },
  });

  map.on("mouseenter", "people-points", (e) => {
    if (mqTouch.matches) return;
    map.getCanvas().style.cursor = "pointer";
    const f = e.features[0];
    if (hoverTip) hoverTip.remove();
    hoverTip = new maplibregl.Popup({
      offset: 12,
      closeButton: false,
      closeOnClick: false,
      className: "hover-tip",
    })
      .setLngLat(f.geometry.coordinates)
      .setHTML(
        `<strong>${f.properties.name}</strong> (${f.properties.lived})<br/>${f.properties.role}`
      )
      .addTo(map);
  });
  map.on("mouseleave", "people-points", () => {
    map.getCanvas().style.cursor = "";
    if (hoverTip) hoverTip.remove();
    hoverTip = null;
  });

  const list = document.getElementById("people-list");
  const birthYear = (f) => parseInt((f.properties.lived.match(/\d{4}/) || ["9999"])[0]);
  const byBirth = [...people.features].sort((a, b) => birthYear(a) - birthYear(b));
  for (const feature of byBirth) {
    const period = periodOf(feature.properties);
    const li = document.createElement("li");
    li.dataset.id = feature.properties.id;
    li.dataset.era = feature.properties.era;
    li.dataset.theme = feature.properties.theme;
    li.dataset.periods = (feature.properties.periods || []).join(" ");
    li.innerHTML = `<span class="year" style="color:${period.color}">${feature.properties.lived}</span>${feature.properties.name}`;
    li.addEventListener("click", () => openFromList(showPerson, feature));
    list.appendChild(li);
  }
}



// --- Suburbs: search, outline, zoom, and spatial filtering ---
const SUBURB_LAYER =
  "https://portal.spatial.nsw.gov.au/server/rest/services/NSW_Administrative_Boundaries_Theme/FeatureServer/2";
let suburbIndex = [];

function titleCase(s) {
  return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function pointInPolygon(pt, rings) {
  // rings: array of linear rings; first is outer, rest holes
  let inside = false;
  for (let r = 0; r < rings.length; r++) {
    const ring = rings[r];
    let hit = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i], [xj, yj] = ring[j];
      if ((yi > pt[1]) !== (yj > pt[1]) &&
          pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) {
        hit = !hit;
      }
    }
    if (r === 0 && !hit) return false; // outside outer ring
    if (r === 0) inside = true;
    else if (hit) return false; // inside a hole
  }
  return inside;
}

function pointInGeometry(pt, geom) {
  if (geom.type === "Polygon") return pointInPolygon(pt, geom.coordinates);
  if (geom.type === "MultiPolygon")
    return geom.coordinates.some((poly) => pointInPolygon(pt, poly));
  return false;
}

async function selectSuburb(entry) {
  const where = encodeURIComponent(`suburbname='${entry.name.replace(/'/g, "''")}'`);
  const url = `${SUBURB_LAYER}/query?where=${where}&outFields=suburbname&outSR=4326&geometryPrecision=5&f=geojson`;
  let boundary;
  try {
    boundary = await (await fetch(url)).json();
  } catch (e) {
    console.warn("suburb boundary fetch failed", e);
    return;
  }
  if (!boundary.features || !boundary.features.length) return;

  activeSuburb = entry;
  map.getSource("suburb-outline").setData(boundary);

  // Spatial filter: which features fall inside the suburb?
  suburbIds = new Set();
  const counts = { story: 0, building: 0, person: 0 };
  for (const [ref, f] of Object.entries(featureIndex)) {
    const pt = f.geometry.coordinates;
    if (boundary.features.some((bf) => pointInGeometry(pt, bf.geometry))) {
      suburbIds.add(f.properties.id);
      counts[ref.split(":")[0]]++;
    }
  }
  applyFilters();

  const [w, s, e, n] = entry.bbox;
  map.fitBounds([[w, s], [e, n]], { padding: 60, maxZoom: 15.5 });

  const total = suburbIds.size;
  const history = entry.history
    ? `<p>${entry.history}</p>`
    : `<p class="hint">No written history for this suburb yet — its pins, if any, tell the story so far.</p>`;
  openDetail(`
    <h3>${titleCase(entry.name)}</h3>
    <span class="era" style="color:#9a4a1f">Suburb${entry.postcode ? " · " + entry.postcode : ""}</span>
    ${history}
    <p class="suburb-counts">${total ? `On this map: ${counts.story} stories, ${counts.building} buildings, ${counts.person} people — filtered below.` : "Nothing pinned here yet — a frontier for the next batch."}</p>`);
  storyDetail.querySelector(".close").addEventListener("click", exitSuburb);

  document.getElementById("suburb-clear").hidden = false;
}

function exitSuburb() {
  activeSuburb = null;
  suburbIds = null;
  map.getSource("suburb-outline").setData(EMPTY_FC);
  document.getElementById("suburb-input").value = "";
  document.getElementById("suburb-clear").hidden = true;
  applyFilters();
}

async function loadSuburbs() {
  suburbIndex = await fetchJSON("data/suburbs.json?v=" + Date.now());
  const list = document.getElementById("suburb-list");
  for (const s of suburbIndex) {
    const opt = document.createElement("option");
    opt.value = titleCase(s.name);
    list.appendChild(opt);
  }
  const input = document.getElementById("suburb-input");
  input.addEventListener("change", () => {
    const name = input.value.trim().toUpperCase();
    const entry = suburbIndex.find((s) => s.name === name);
    if (entry) {
      closeStory();
      selectSuburb(entry);
    }
  });
  document.getElementById("suburb-clear").addEventListener("click", () => {
    exitSuburb();
    closeStory();
  });
}

// --- Global search: people, places & stories, with native autocomplete ---
function buildSearch() {
  const list = document.getElementById("feature-list");
  const input = document.getElementById("feature-input");
  const clear = document.getElementById("feature-clear");
  const TYPE_LABEL = { story: "Story", building: "Building", person: "Person", street: "Street" };
  const byValue = {};
  const entries = Object.entries(featureIndex)
    .map(([ref, f]) => ({ ref, type: ref.split(":")[0], name: f.properties.title || f.properties.name }))
    .filter((e) => e.name)
    .sort((a, b) => a.name.localeCompare(b.name));
  for (const e of entries) {
    let value = `${e.name} · ${TYPE_LABEL[e.type]}`;
    while (byValue[value]) value += " ·"; // disambiguate same-name entries
    byValue[value] = e.ref;
    const opt = document.createElement("option");
    opt.value = value;
    list.appendChild(opt);
  }
  function go() {
    const ref = byValue[input.value.trim()];
    if (!ref) return;
    const f = featureIndex[ref];
    const type = ref.split(":")[0];
    const show = { story: showStory, building: showBuilding, person: showPerson, street: showStreet }[type];
    if (show) openFromList(show, f); // clear any active dossier/tour so the guard can fire
    clear.hidden = false;
  }
  input.addEventListener("change", go);
  input.addEventListener("input", () => { if (byValue[input.value.trim()]) go(); });
  clear.addEventListener("click", () => { input.value = ""; clear.hidden = true; });
}

// --- Evolution: a 30-second sweep from Country to today ---
const EVOLUTION = {
  start: 1770,
  end: 2026,
  duration: 30000,
  stages: [
    { until: 1787, year: "country", label: "Country" },
    { until: 1840, year: "1840", label: "Colonial" },
    { until: 1899, year: "1899", label: "Victorian" },
    { until: 1918, year: "1919", label: "Federation" },
    { until: 1954, year: "1943c", label: "Wartime" },
    { until: 1964, year: "1955", label: "Post-war" },
    { until: 1969, year: "1965", label: "The boom" },
    { until: 1993, year: "1975", label: "Modern" },
    { until: 2004, year: "1994", label: "Pre-Olympics" },
    { until: 2015, year: "2005", label: "The new century" },
    { until: 9999, year: "today", label: "Now" },
  ],
};
let evolutionFrame = null;
const evolutionHud = document.getElementById("evolution-hud");
const evolutionBtn = document.getElementById("evolution-btn");

function evolutionStage(y) {
  return EVOLUTION.stages.find((s) => y <= s.until);
}

function applyStage(stage) {
  setYear(stage.year);
  map.setPaintProperty("modern", "raster-saturation", stage.saturate ? 0.45 : 0);
  if (map.getLayer("year-1943")) {
    map.setPaintProperty("year-1943", "raster-brightness-min", stage.fade ? stage.fade[0] : 0);
    map.setPaintProperty("year-1943", "raster-contrast", stage.fade ? stage.fade[1] : 0);
  }
}

const EV_LAYERS = ["ev-footprint", "ev-footprint-edge", "ev-roads", "ev-rail"];

function setEvolutionLayers(on) {
  for (const id of EV_LAYERS) {
    if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", on ? "visible" : "none");
  }
}

function stopEvolution(finished) {
  if (evolutionFrame) cancelAnimationFrame(evolutionFrame);
  evolutionFrame = null;
  setEvolutionLayers(false);
  evolutionHud.hidden = true;
  evolutionBtn.textContent = "\u25b6 Watch Sydney grow \u2014 30 seconds";
  if (finished) {
    setPeriod("now");
  } else {
    setPeriod(activePeriod); // restore whatever era was active
  }
}

function startEvolution() {
  if (evolutionFrame) {
    stopEvolution(false);
    return;
  }
  closeStory();
  if (activeTour) exitTour();
  evolutionBtn.textContent = "\u25a0 Stop";
  evolutionHud.hidden = false;
  setEvolutionLayers(true);
  const t0 = performance.now();
  let currentStage = null;
  let lastFilterYear = 0;

  function frame(now) {
    const progress = Math.min((now - t0) / EVOLUTION.duration, 1);
    const y = Math.round(EVOLUTION.start + (EVOLUTION.end - EVOLUTION.start) * progress);
    const stage = evolutionStage(y);
    if (stage !== currentStage) {
      currentStage = stage;
      applyStage(stage);
      evolutionHud.querySelector(".ev-era").textContent = stage.label;
    }
    evolutionHud.querySelector(".ev-year").textContent = y < 1788 ? "before 1788" : y;
    if (y !== lastFilterYear) {
      lastFilterYear = y;
      const f = ["<=", ["get", "appear"], y];
      for (const t of TYPES) {
        if (map.getLayer(t.layer)) map.setFilter(t.layer, f);
      }
      const kinds = { "ev-footprint": "footprint", "ev-footprint-edge": "footprint", "ev-roads": "road", "ev-rail": "rail" };
      for (const [id, kind] of Object.entries(kinds)) {
        if (map.getLayer(id)) {
          map.setFilter(id, ["all", ["==", ["get", "kind"], kind], ["<=", ["get", "from"], y]]);
        }
      }
    }
    if (progress < 1) {
      evolutionFrame = requestAnimationFrame(frame);
    } else {
      stopEvolution(true);
    }
  }
  evolutionFrame = requestAnimationFrame(frame);
}

evolutionBtn.addEventListener("click", startEvolution);

map.on("load", async () => {
  try {
    coverage = await (await fetch("data/coverage.json?v=" + Date.now())).json();
  } catch (e) {
    coverage = {}; // outline simply won't show; the dim layer still works
  }
  setPeriod(activePeriod);

  // Reconstruction layers for the evolution animation (hidden until played).
  try {
    const evo = await (await fetch("data/evolution.geojson?v=" + Date.now())).json();
    map.addSource("evolution", { type: "geojson", data: evo });
    map.addLayer({
      id: "ev-footprint",
      type: "fill",
      source: "evolution",
      filter: ["==", ["get", "kind"], "footprint"],
      layout: { visibility: "none" },
      paint: { "fill-color": "#d8a84a", "fill-opacity": 0.32 },
    });
    map.addLayer({
      id: "ev-footprint-edge",
      type: "line",
      source: "evolution",
      filter: ["==", ["get", "kind"], "footprint"],
      layout: { visibility: "none" },
      paint: { "line-color": "#b3801f", "line-width": 1, "line-opacity": 0.6 },
    });
    map.addLayer({
      id: "ev-roads",
      type: "line",
      source: "evolution",
      filter: ["==", ["get", "kind"], "road"],
      layout: { visibility: "none", "line-cap": "round" },
      paint: { "line-color": "#7a4a1a", "line-width": 2 },
    });
    map.addLayer({
      id: "ev-rail",
      type: "line",
      source: "evolution",
      filter: ["==", ["get", "kind"], "rail"],
      layout: { visibility: "none", "line-cap": "round" },
      paint: { "line-color": "#2b2118", "line-width": 2, "line-dasharray": [3, 1.5] },
    });
  } catch (e) {
    console.warn("evolution layer unavailable", e);
  }

  // Suburb outline sits under the pins.
  map.addSource("suburb-outline", { type: "geojson", data: EMPTY_FC });
  map.addLayer({
    id: "suburb-fill",
    type: "fill",
    source: "suburb-outline",
    paint: { "fill-color": "#d4582a", "fill-opacity": 0.06 },
  });
  map.addLayer({
    id: "suburb-line",
    type: "line",
    source: "suburb-outline",
    layout: { "line-join": "round" },
    paint: { "line-color": "#d4582a", "line-width": 2.5, "line-opacity": 0.9 },
  });

  // Tour route sits under the pins (added first, so pin layers stack above it).
  // Two layers: the road still ahead (faint dots) and the ground already walked
  // (solid), so the line visibly fills in as you complete stops.
  map.addSource("tour-route", { type: "geojson", data: EMPTY_FC });
  map.addLayer({
    id: "tour-route",
    type: "line",
    source: "tour-route",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": "#d4582a",
      "line-width": 3,
      "line-opacity": 0.5,
      "line-dasharray": [0.1, 2],
    },
  });
  map.addSource("tour-route-done", { type: "geojson", data: EMPTY_FC });
  map.addLayer({
    id: "tour-route-done",
    type: "line",
    source: "tour-route-done",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": "#d4582a",
      "line-width": 4.5,
    },
  });
  // The single leg being walked right now — brightly highlighted over the route
  // while the between-stops walk card is open.
  map.addSource("tour-leg", { type: "geojson", data: EMPTY_FC });
  map.addLayer({
    id: "tour-leg",
    type: "line",
    source: "tour-leg",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": "#e0873a",
      "line-width": 6,
    },
  });

  await loadStories();
  await loadBuildings();
  await loadPeople();
  await loadStreets();
  buildSearch();
  await loadDossiers();

  // A soft pulsing halo on the NEXT stop — a subtle beacon drawing you onward.
  // Sits under the badges (added before them) so the number stays crisp on top.
  map.addSource("tour-beacon", { type: "geojson", data: EMPTY_FC });
  map.addLayer({
    id: "tour-beacon",
    type: "circle",
    source: "tour-beacon",
    paint: {
      "circle-color": "#e0873a",
      "circle-opacity": 0.4,
      "circle-radius": 14,
      "circle-stroke-width": 0,
    },
  });

  // Numbered stop badges, above the pins. Colour + size encode each stop's
  // state relative to where you are: done · current · next · upcoming.
  map.addSource("tour-stops", { type: "geojson", data: EMPTY_FC });
  map.addLayer({
    id: "tour-stop-badges",
    type: "circle",
    source: "tour-stops",
    paint: {
      "circle-radius": ["match", ["get", "state"],
        "current", 11, "next", 10, "done", 8, /* upcoming */ 8],
      "circle-color": ["match", ["get", "state"],
        "done", "#bf7a58", "current", "#d4582a", "next", "#e0873a", /* upcoming */ "#c2b7a3"],
      "circle-stroke-width": ["match", ["get", "state"], "current", 3, 2],
      "circle-stroke-color": "#f7f3ec",
    },
  });
  map.addLayer({
    id: "tour-stop-numbers",
    type: "symbol",
    source: "tour-stops",
    layout: {
      "text-field": ["get", "label"],
      "text-size": 11,
      "text-font": ["Noto Sans Regular"],
      "text-allow-overlap": true,
    },
    paint: { "text-color": "#ffffff" },
  });

  await loadTours();
  await loadSuburbs();
  setupCollapsibles();

  // Data is in — clear the loading overlay and reveal the on-map UI.
  const boot = document.getElementById("boot");
  if (boot) { boot.style.opacity = "0"; setTimeout(() => boot.remove(), 450); }
  document.body.classList.add("ready");
  fitMap();

  // Tour-first: open onto the "choose a tour" landing screen (the map waits
  // behind it). "Explore the map freely" or a tour takes over from here.
  buildLauncher();
  showLauncher();
});

// If any data load rejects, the boot overlay stays — turn it into an error message.
window.addEventListener("unhandledrejection", () => {
  const boot = document.getElementById("boot");
  if (boot && boot.style.opacity !== "0") {
    boot.classList.add("error");
    boot.textContent = "Couldn't load the map data. Check your connection and refresh.";
  }
});

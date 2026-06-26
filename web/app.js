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
  style: {
    version: 8,
    glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
    sources,
    layers,
  },
});

map.addControl(new maplibregl.NavigationControl(), "top-right");

// Unified pin click: query a PADDED box around the tap (bigger on touch) so
// pins are easy to hit, then open the nearest one. Tapping empty closes the
// open card. Playback (tour/dossier) handles its own navigation.
const SHOW_BY_TYPE = { story: showStory, building: showBuilding, people: showPerson, street: showStreet };
map.on("click", (e) => {
  if (creditsEl && creditsEl.classList.contains("open")) { setCredits(false); return; }
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
  });
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

// --- Image lightbox: click any card/tour image to view it large + zoom ---
function openLightbox(src, caption) {
  let lb = document.getElementById("lightbox");
  if (!lb) {
    lb = document.createElement("div");
    lb.id = "lightbox";
    lb.innerHTML =
      `<button class="lb-close" aria-label="Close image">✕</button>` +
      `<div class="lb-scroll"><img class="lb-img" alt="" /></div>` +
      `<div class="lb-cap"></div>`;
    document.body.appendChild(lb);
    lb.addEventListener("click", (e) => {
      if (e.target === lb || e.target.classList.contains("lb-scroll") || e.target.classList.contains("lb-close")) closeLightbox();
    });
    lb.querySelector(".lb-img").addEventListener("click", (e) => {
      e.stopPropagation();
      lb.classList.toggle("zoomed"); // tap image to zoom in / out
    });
  }
  lb.querySelector(".lb-img").src = src;
  lb.querySelector(".lb-img").alt = caption || "";
  lb.querySelector(".lb-cap").textContent = caption || "";
  lb.classList.remove("zoomed");
  lb.classList.add("open");
}
function closeLightbox() {
  const lb = document.getElementById("lightbox");
  if (lb) lb.classList.remove("open");
}
// Clicking a card image or tour-stop image opens the lightbox (not a link-out).
storyDetail.addEventListener("click", (e) => {
  const wrap = e.target.closest(".story-img, .tour-stop-img");
  if (!wrap) return;
  e.preventDefault();
  const img = wrap.matches("img") ? wrap : wrap.querySelector("img");
  if (img) openLightbox(img.currentSrc || img.src, img.alt);
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
  storyDetail.classList.toggle("playing", on); // drives the Ken-Burns image zoom
  const btn = document.querySelector(".tplay");
  if (btn) btn.innerHTML = on ? "❚❚ Pause" : "▶ Play";
  if (on) scheduleAdvance();
}

function exitTour() {
  clearTourTimer();
  tourPlaying = false;
  storyDetail.classList.remove("playing");
  activeTour = null;
  map.getSource("tour-route").setData(EMPTY_FC);
  map.getSource("tour-stops").setData(EMPTY_FC);
  map.easeTo({ pitch: 0, bearing: 0, duration: 600 });
  if (yearBeforeTour && yearBeforeTour !== activeYear) setYear(yearBeforeTour);
  yearBeforeTour = null;
  // Restore the ordinary pins to whatever the type filters had them at.
  for (const t of TYPES) {
    if (map.getLayer(t.layer)) map.setLayoutProperty(t.layer, "visibility", typeVisible[t.id] ? "visible" : "none");
  }
  document.querySelectorAll("#tour-list li").forEach((li) => li.classList.remove("active"));
  closeStory();
}

function showTourStop(i) {
  tourIndex = i;
  const stop = activeTour.stops[i];
  const feature = featureIndex[stop.ref];
  const type = stop.ref.split(":")[0];
  // Render the feature panel but keep the map still — we drive the camera ourselves.
  suppressFly = true;
  ({ story: showStory, building: showBuilding, person: showPerson, street: showStreet })[type](feature);
  suppressFly = false;

  // Per-stop cinematic camera (falls back to a clean overhead framing).
  const cam = stop.camera || {};
  map.flyTo({
    center: feature.geometry.coordinates,
    zoom: cam.zoom ?? Math.max(map.getZoom(), 15.5),
    pitch: cam.pitch ?? 0,
    bearing: cam.bearing ?? 0,
    speed: tourPlaying ? 0.6 : 0.9,
    curve: 1.5,
    essential: true,
  });

  const last = i === activeTour.stops.length - 1;
  const media =
    (stop.image ? `<img class="tour-stop-img" src="${stop.image}" alt="${stop.caption || ""}" loading="lazy" />${stop.caption ? `<span class="tour-stop-cap">${stop.caption}</span>` : ""}` : "") +
    (stop.quote ? `<blockquote class="tour-quote">${stop.quote}</blockquote>` : "");
  const branches = Array.isArray(stop.branches) && stop.branches.length
    ? `<div class="tour-branches"><span class="tour-branch-label">Choose a path</span>${stop.branches
        .map((b, bi) => `<button class="tbranch" data-bi="${bi}">${b.label} ›</button>`)
        .join("")}</div>`
    : "";

  const nav = document.createElement("div");
  nav.className = "tour-nav";
  nav.innerHTML = `
    <div class="tour-head"><strong>${activeTour.title}</strong><span>Stop ${i + 1} of ${activeTour.stops.length}</span></div>
    ${stop.note ? `<p class="tour-note">${stop.note}</p>` : ""}
    ${media}
    ${branches}
    <div class="tour-buttons">
      <button class="tprev" ${i === 0 ? "disabled" : ""}>‹ Back</button>
      <button class="tplay">${tourPlaying ? "❚❚ Pause" : "▶ Play"}</button>
      <button class="tnext">${last ? "Finish" : "Next ›"}</button>
      <button class="texit">End</button>
    </div>`;
  // Insert after the close button, above the image.
  storyDetail.insertBefore(nav, storyDetail.children[1]);
  storyDetail.classList.toggle("playing", tourPlaying);
  nav.querySelector(".tprev").addEventListener("click", () => { clearTourTimer(); showTourStop(i - 1); });
  nav.querySelector(".tnext").addEventListener("click", () => { clearTourTimer(); last ? exitTour() : showTourStop(i + 1); });
  nav.querySelector(".tplay").addEventListener("click", () => setTourPlaying(!tourPlaying));
  nav.querySelector(".texit").addEventListener("click", exitTour);
  nav.querySelectorAll(".tbranch").forEach((btn) =>
    btn.addEventListener("click", () => {
      clearTourTimer();
      followBranch(stop.branches[+btn.dataset.bi]);
    })
  );

  // Keep auto-play chaining.
  if (tourPlaying) scheduleAdvance();
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
  activeTour = tour;
  document.querySelectorAll("#tour-list li").forEach((li) => {
    li.classList.toggle("active", li.dataset.id === tour.id);
  });
  if (tour.year) {
    yearBeforeTour = activeYear;
    setYear(tour.year);
  }
  const coords = tour.stops.map((s) => featureIndex[s.ref].geometry.coordinates);
  map.getSource("tour-route").setData({
    type: "Feature",
    properties: {},
    geometry: { type: "LineString", coordinates: coords },
  });
  map.getSource("tour-stops").setData({
    type: "FeatureCollection",
    features: tour.stops.map((s, i) => ({
      type: "Feature",
      properties: { label: String(i + 1) },
      geometry: featureIndex[s.ref].geometry,
    })),
  });
  // During a tour, hide the ordinary pins so only the tour's route and stops show.
  for (const t of TYPES) {
    if (map.getLayer(t.layer)) map.setLayoutProperty(t.layer, "visibility", "none");
  }
  showTourStop(0);
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
  }
  // Cross-link: every feature in a dossier is "in the same deep dive" as the others.
  for (const d of list) {
    const keys = [d.anchor, ...d.chapters.filter((c) => c.ref).map((c) => c.ref)].filter((k) => featureIndex[k]);
    for (const k of keys) (dossierLinks[k] ||= []).push(...keys.filter((o) => o !== k));
  }
  console.log("[dossiers] loaded", Object.keys(dossiersByAnchor).length, "anchors");
  window.__dossiersByAnchor = dossiersByAnchor;
  try { applyFilters(); } catch (e) { console.warn("[dossiers] applyFilters failed (non-fatal)", e); }
}

function exitDossier() {
  activeDossier = null;
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
  activeDossier = d;
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

const TOUR_KIND_LABEL = { time: "Through time", theme: "By theme", walk: "Walk" };

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
  const opts = [["all", "All"], ["time", "Through time"], ["theme", "By theme"], ["walk", "Walks"]]
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

// Assemble an ephemeral tour from features matching a theme (+ optional era),
// ordered nearest-to-nearest from the northernmost match.
function buildDynamicTour(theme, era) {
  const matches = [];
  for (const key in featureIndex) {
    const f = featureIndex[key];
    if (!f.geometry || f.geometry.type !== "Point") continue;
    const p = f.properties;
    const themes = Array.isArray(p.theme) ? p.theme : p.theme ? [p.theme] : [];
    if (theme && !themes.includes(theme)) continue;
    if (era && p.era !== era) continue;
    matches.push(key);
  }
  if (matches.length < 2) return null;
  // start at the northernmost, then greedily hop to the nearest unvisited
  let start = matches[0];
  for (const k of matches)
    if (featureIndex[k].geometry.coordinates[1] > featureIndex[start].geometry.coordinates[1]) start = k;
  const ordered = [start];
  const remaining = new Set(matches);
  remaining.delete(start);
  while (remaining.size && ordered.length < 10) {
    const last = featureIndex[ordered[ordered.length - 1]].geometry.coordinates;
    let best = null, bestd = Infinity;
    for (const k of remaining) {
      const d = metersBetween(last, featureIndex[k].geometry.coordinates);
      if (d < bestd) { bestd = d; best = k; }
    }
    ordered.push(best);
    remaining.delete(best);
  }
  const stops = ordered.map((key) => ({ ref: key, note: featureIndex[key].properties.summary || "" }));
  const eraLabel = era ? era.replace(" Sydney", "") : "";
  return {
    id: "dynamic",
    title: theme + (eraLabel ? " · " + eraLabel : ""),
    blurb: `A generated route through ${stops.length} ${theme.toLowerCase()} places${eraLabel ? " of " + eraLabel.toLowerCase() + " Sydney" : ""}, linked nearest-to-nearest.`,
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
  wrap.querySelector(".tb-go").addEventListener("click", () => {
    const theme = wrap.querySelector(".tb-theme").value;
    const era = wrap.querySelector(".tb-era").value;
    const tour = buildDynamicTour(theme, era);
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
  // order: chronologies, then themes, then walks
  const order = { time: 0, theme: 1, walk: 2 };
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
  // A story with a deep dive opens straight into its paged chapter series.
  if (!activeDossier && !activeTour && dossiersByAnchor["story:" + p.id]) {
    openDossier(dossiersByAnchor["story:" + p.id]);
    return;
  }
  const coords = feature.geometry.coordinates;
  const period = periodOf(p);

  document.querySelectorAll("#story-list li, #building-list li, #people-list li").forEach((li) => {
    li.classList.toggle("active", li.dataset.id === p.id && li.closest("#story-list") !== null);
  });

  openDetail(`
    ${mediaHtml(mediaList(p))}
    <h3>${p.title}</h3>
    ${asArray(p.body).map((x) => `<p>${inlineMd(x)}</p>`).join("")}
    ${detailPapers(p)}
    ${relatedHtml(`story:${p.id}`)}
    <span class="source">Sources: ${p.source}</span>`);

  if (!suppressFly) flyToFeature(feature);
  else if (mqMobile.matches) setSheet(true); // already positioned (tour/dossier/hop) — open now
}

function showBuilding(feature) {
  const p = feature.properties;
  // A landmark with a deep dive opens straight into its mother-pin series.
  console.log("[showBuilding]", p.id, "| dossier match:", !!dossiersByAnchor["building:" + p.id], "| activeDossier:", !!activeDossier, "| activeTour:", !!activeTour, "| anchors loaded:", Object.keys(dossiersByAnchor).length);
  if (!activeDossier && !activeTour && dossiersByAnchor["building:" + p.id]) {
    openDossier(dossiersByAnchor["building:" + p.id]);
    return;
  }
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
    <ul class="timeline">${timelineHtml}</ul>
    ${storiesHtml}
    ${detailPapers(p)}
    ${relatedHtml(`building:${p.id}`)}
    <span class="source">Sources: ${p.source}</span>`);

  if (!suppressFly) flyToFeature(feature);
  else if (mqMobile.matches) setSheet(true); // already positioned (tour/dossier/hop) — open now
}

function showStreet(feature) {
  const p = feature.properties;
  // A street with a deep dive opens straight into its mother-pin series.
  if (!activeDossier && !activeTour && dossiersByAnchor["street:" + p.id]) {
    openDossier(dossiersByAnchor["street:" + p.id]);
    return;
  }
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
    <ul class="timeline">${timelineHtml}</ul>
    ${detailPapers(p)}
    ${relatedHtml(`street:${p.id}`)}
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
      "line-width": ["interpolate", ["linear"], ["zoom"], 10, 2, 13, 3.5, 16, 6],
      "line-opacity": 0.85,
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
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 3.5, 13, 5.5, 16, 8],
      "circle-color": periodColorExpression,
      "circle-stroke-width": ["interpolate", ["linear"], ["zoom"], 10, 1, 13, 1.5, 16, 2],
      "circle-stroke-color": "#f7f3ec",
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
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 3.5, 13, 5, 16, 7],
      "circle-color": "#f7f3ec",
      "circle-stroke-width": ["interpolate", ["linear"], ["zoom"], 10, 1.5, 13, 2.25, 16, 3],
      "circle-stroke-color": periodColorExpression,
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
  // A person with a life deep dive opens straight into their mother-pin series.
  if (!activeDossier && !activeTour && dossiersByAnchor["person:" + p.id]) {
    openDossier(dossiersByAnchor["person:" + p.id]);
    return;
  }
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
    ${body.map((para) => `<p>${para}</p>`).join("")}
    ${detailPapers(p)}
    ${relatedHtml(`person:${p.id}`)}
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
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 2.75, 13, 4, 16, 5.5],
      "circle-color": "#2b2118",
      "circle-stroke-width": ["interpolate", ["linear"], ["zoom"], 10, 1.25, 13, 1.9, 16, 2.5],
      "circle-stroke-color": periodColorExpression,
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
  map.addSource("tour-route", { type: "geojson", data: EMPTY_FC });
  map.addLayer({
    id: "tour-route",
    type: "line",
    source: "tour-route",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": "#d4582a",
      "line-width": 3,
      "line-dasharray": [0.1, 2],
    },
  });

  await loadStories();
  await loadBuildings();
  await loadPeople();
  await loadStreets();
  buildSearch();
  await loadDossiers();

  // Numbered stop badges, above the pins.
  map.addSource("tour-stops", { type: "geojson", data: EMPTY_FC });
  map.addLayer({
    id: "tour-stop-badges",
    type: "circle",
    source: "tour-stops",
    paint: {
      "circle-radius": 9,
      "circle-color": "#d4582a",
      "circle-stroke-width": 2,
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

  // Data is in — clear the loading overlay.
  const boot = document.getElementById("boot");
  if (boot) { boot.style.opacity = "0"; setTimeout(() => boot.remove(), 450); }
});

// If any data load rejects, the boot overlay stays — turn it into an error message.
window.addEventListener("unhandledrejection", () => {
  const boot = document.getElementById("boot");
  if (boot && boot.style.opacity !== "0") {
    boot.classList.add("error");
    boot.textContent = "Couldn't load the map data. Check your connection and refresh.";
  }
});

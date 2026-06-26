"use strict";
// ---- config -------------------------------------------------------------
const COLLECTIONS = {
  people:    { file: "people.geojson",    kind: "geojson", type: "person" },
  stories:   { file: "stories.geojson",   kind: "geojson", type: "story" },
  buildings: { file: "buildings.geojson", kind: "geojson", type: "building" },
  streets:   { file: "streets.geojson",   kind: "geojson", type: "street" },
  dossiers:  { file: "dossiers.json",     kind: "list",    type: "dossier" },
};
const TABS = ["people", "stories", "buildings", "streets", "dossiers"];
const AI_TELLS = ["rich tapestry", "stands as a testament", "a testament to", "testament to",
  "indelible", "nestled", "boasts", "bustling", "vibrant tapestry", "plays a vital role",
  "rich history", "stands as", "from humble beginnings", "it is worth noting", "delve"];

const SCHEMA = {
  person: [["name","Name","text"],["lived","Lived","text"],["role","Role","text"],
    ["place","Place","text"],["era","Era","text"],["theme","Theme","text"],
    ["summary","Summary","textarea"],["body","Body (one entry = one paragraph)","paras"],
    ["related","Related keys (one per line)","keys"],["source","Source","text"],
    ["images","Images (multiple = swipeable carousel)","images"]],
  story: [["title","Title","text"],["year","Year","text"],["era","Era","text"],["theme","Theme","text"],
    ["summary","Summary","textarea"],["body","Body (one entry = one paragraph)","paras"],
    ["related","Related keys (one per line)","keys"],["source","Source","text"],
    ["images","Images (multiple = swipeable carousel)","images"]],
  building: [["name","Name","text"],["built","Built","text"],["architect","Architect","text"],
    ["era","Era","text"],["original_use","Original use","text"],["current_use","Current use","text"],
    ["theme","Theme","text"],["summary","Summary","textarea"],["timeline","Timeline","timeline"],
    ["stories","Story paragraphs","paras"],["source","Source","text"],
    ["images","Images (multiple = swipeable carousel)","images"]],
  street: [["name","Name","text"],["built","Built","text"],["era","Era","text"],
    ["original_use","Original use","text"],["current_use","Current use","text"],["theme","Theme","text"],
    ["summary","Summary","textarea"],["timeline","Timeline","timeline"],
    ["related","Related keys (one per line)","keys"],["source","Source","text"],
    ["images","Images (multiple = swipeable carousel)","images"]],
  dossier: [["title","Title","text"],["anchor","Anchor","readonly"],["chapters","Chapters","chapters"]],
};

// ---- state --------------------------------------------------------------
const COL = {};            // tab -> {file, kind, type, raw, items:[{key,type,name,props}]}
let review = {};           // key -> {reviewed, note}
const dirty = new Set();   // file names with unsaved edits
let activeTab = "people";
let activeKey = null;

const $ = (s, r = document) => r.querySelector(s);
const el = (t, props = {}, kids = []) => {
  const n = document.createElement(t);
  if (t === "textarea" || (t === "input" && (!props.type || props.type === "text"))) n.spellcheck = true;
  for (const k in props) {
    if (k === "class") n.className = props[k];
    else if (k === "html") n.innerHTML = props[k];
    else if (k.startsWith("on")) n.addEventListener(k.slice(2), props[k]);
    else if (props[k] != null) n.setAttribute(k, props[k]);
  }
  for (const c of [].concat(kids)) if (c != null) n.append(c.nodeType ? c : document.createTextNode(c));
  return n;
};
const esc = (s) => String(s == null ? "" : s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

// ---- load ---------------------------------------------------------------
async function boot() {
  for (const tab of TABS) {
    const c = COLLECTIONS[tab];
    const raw = await (await fetch(`../data/${c.file}?v=${Date.now()}`)).json();
    const items = [];
    if (c.kind === "geojson") {
      for (const f of raw.features) {
        const p = f.properties;
        items.push({ key: `${c.type}:${p.id}`, type: c.type, props: p, get name() { return p.name || p.title || p.id; } });
      }
    } else {
      for (const d of raw) items.push({ key: d.anchor || d.id, type: c.type, props: d, get name() { return d.title || d.id; } });
    }
    COL[tab] = { ...c, raw, items };
  }
  try { review = await (await fetch(`../data/review-state.json?v=${Date.now()}`)).json(); } catch { review = {}; }
  renderTabs();
  selectTab("people");
  $("#save-state").textContent = "ready";
  $("#search").addEventListener("input", renderList);
  $("#filter").addEventListener("change", renderList);
  $("#save-btn").addEventListener("click", saveActiveFile);
  $("#publish-btn").addEventListener("click", publishLive);
  $("#editor").addEventListener("input", (e) => { if (e.target.tagName === "TEXTAREA") autosize(e.target); });
  $("#editor").addEventListener("click", () => requestAnimationFrame(autosizeAll)); // after add/move/delete redraws
  document.addEventListener("keydown", onKey);
}

// ---- tabs + list --------------------------------------------------------
function renderTabs() {
  const nav = $("#tabs"); nav.innerHTML = "";
  for (const tab of TABS) {
    const items = COL[tab].items;
    const rev = items.filter((i) => review[i.key] && review[i.key].reviewed).length;
    nav.append(el("button", { class: "tab" + (tab === activeTab ? " active" : ""), onclick: () => selectTab(tab) },
      [tab[0].toUpperCase() + tab.slice(1), el("span", { class: "cnt" }, `${rev}/${items.length}`)]));
  }
}
function selectTab(tab) { activeTab = tab; activeKey = null; renderTabs(); renderList(); $("#editor").hidden = true; $("#empty").hidden = false; $("#side-pane").hidden = true; }

// Create a new deep-dive (dossier) anchored to any feature, e.g. a story.
function createDossier() {
  const anchor = (window.prompt("Anchor this deep dive to which feature?\nUse type:id, e.g.  story:shark-arm-case  /  building:qvb  /  person:bennelong") || "").trim();
  if (!anchor) return;
  if (!/^(story|building|person|street):[a-z0-9-]+$/.test(anchor)) { toast("Anchor must be type:id (story:..., building:..., person:..., street:...)", true); return; }
  const col = COL.dossiers;
  if (col.raw.some((d) => d.anchor === anchor)) { toast("A deep dive already anchors that feature.", true); selectItem(anchor); return; }
  const type = anchor.split(":")[0], fid = anchor.split(":")[1];
  // confirm the feature exists
  const tabFor = { story: "stories", building: "buildings", person: "people", street: "streets" }[type];
  if (!COL[tabFor] || !COL[tabFor].items.some((i) => i.key === anchor)) {
    if (!window.confirm(`No ${type} with id "${fid}" is loaded. Create the deep dive anyway?`)) return;
  }
  let id = fid;
  if (col.raw.some((d) => d.id === id)) id = `${type}-${fid}`;
  const d = { id, anchor, title: "", chapters: [{ ref: anchor }] };
  col.raw.push(d);
  col.items.push({ key: anchor, type: "dossier", props: d, get name() { return d.title || d.id; } });
  markDirty(); renderTabs(); renderList(); selectItem(anchor);
  toast("New deep dive created. Add chapters, then Save.");
}

function lintText(item) { return collectText(item).match(/—/) ? "em" : (hasAiTell(collectText(item)) ? "ai" : ""); }
function renderList() {
  const q = $("#search").value.trim().toLowerCase();
  const filt = $("#filter").value;
  const ul = $("#item-list"); ul.innerHTML = "";
  if (activeTab === "dossiers") {
    ul.append(el("li", { class: "newdoss", onclick: createDossier }, [el("span", { class: "nm" }, "＋ New deep dive…")]));
  }
  let shown = 0;
  for (const it of COL[activeTab].items) {
    if (q && !(it.name.toLowerCase().includes(q) || it.key.toLowerCase().includes(q))) continue;
    const rv = review[it.key] && review[it.key].reviewed;
    const lt = lintText(it);
    if (filt === "unreviewed" && rv) continue;
    if (filt === "reviewed" && !rv) continue;
    if (filt === "emdash" && lt !== "em") continue;
    if (filt === "aitell" && !lt) continue;
    shown++;
    ul.append(el("li", { class: it.key === activeKey ? "active" : "", onclick: () => selectItem(it.key) }, [
      el("span", { class: "nm" }, it.name),
      lt === "em" ? el("span", { class: "mk wn", title: "em dash" }, "—") : (lt === "ai" ? el("span", { class: "mk wn", title: "AI tell" }, "⚠") : null),
      rv ? el("span", { class: "mk rv", title: "reviewed" }, "✓") : null,
    ]));
  }
  $("#list-count").textContent = `${shown} shown · ${COL[activeTab].items.length} total`;
}

// ---- editor -------------------------------------------------------------
function curItem() { return COL[activeTab].items.find((i) => i.key === activeKey); }
function selectItem(key) {
  activeKey = key; renderList();
  const it = curItem(); if (!it) return;
  $("#empty").hidden = true; $("#side-pane").hidden = false;
  const form = $("#editor"); form.hidden = false; form.innerHTML = "";

  // review bar
  const r = review[it.key] || { reviewed: false, note: "" };
  const chk = el("input", { type: "checkbox" }); chk.checked = !!r.reviewed;
  chk.addEventListener("change", () => { setReview(it.key, { reviewed: chk.checked }); });
  const note = el("input", { type: "text", placeholder: "Review note (optional)" }); note.value = r.note || "";
  note.addEventListener("input", () => setReview(it.key, { note: note.value }));
  form.append(el("div", { class: "reviewbar" }, [el("label", {}, [chk, " Reviewed"]), note,
    el("span", { class: "muted", style: "font-size:12px" }, it.key),
    it.type === "dossier" ? el("button", { type: "button", class: "danger", onclick: () => deleteDossier(it.key) }, "Delete deep dive") : null]));

  for (const [k, label, kind] of SCHEMA[it.type]) form.append(buildField(it, k, label, kind));
  refreshSide();
  requestAnimationFrame(autosizeAll);
}

// Grow textareas to fit their content (respecting each box's min-height).
function autosize(ta) {
  if (ta.clientWidth < 50) return; // don't measure a collapsed box (would blow up the height)
  const mh = parseInt(getComputedStyle(ta).minHeight) || 0;
  ta.style.height = "auto";
  ta.style.height = Math.max(ta.scrollHeight + 2, mh) + "px";
}
function autosizeAll() { document.querySelectorAll("#editor textarea").forEach(autosize); }

function markDirty() { dirty.add(COL[activeTab].file); const s = $("#save-state"); s.textContent = "unsaved changes"; s.classList.add("dirty"); $("#save-btn").disabled = false; renderTabs(); }

function deleteDossier(key) {
  if (!window.confirm("Delete this deep dive?\nThe anchor card (story/building/etc.) and other features are NOT affected. You'll still need to Save to make it permanent.")) return;
  const col = COL.dossiers;
  const ri = col.raw.findIndex((d) => (d.anchor || d.id) === key);
  if (ri >= 0) col.raw.splice(ri, 1);
  const ii = col.items.findIndex((i) => i.key === key);
  if (ii >= 0) col.items.splice(ii, 1);
  activeKey = null;
  markDirty(); renderTabs(); renderList();
  $("#editor").hidden = true; $("#empty").hidden = false; $("#side-pane").hidden = true;
  toast("Deep dive deleted — click Save to confirm.");
}

// Reusable multi-image editor (url + upload + caption + credit, reorder/remove).
// Works on any object that holds an `images` array (a card's props, or a chapter).
function imageEditor(host, owner, onChange) {
  if (!Array.isArray(owner.images)) {
    owner.images = owner.image ? [{ url: owner.image, caption: owner.image_caption || "", link: owner.image_link || "" }] : [];
    delete owner.image; delete owner.image_caption; delete owner.image_link;
  }
  const imgs = owner.images;
  const idraw = () => {
    host.innerHTML = "";
    imgs.forEach((im, ii) => {
      const row = el("div", { class: "imgrow" });
      const mk = (k, ph) => {
        const inp = el("input", { type: "text", placeholder: ph, value: im[k] || "" });
        inp.addEventListener("input", () => { im[k] = inp.value; onChange(); });
        return inp;
      };
      const up = el("button", { type: "button", onclick: () => { if (ii) { [imgs[ii-1],imgs[ii]]=[imgs[ii],imgs[ii-1]]; onChange(); idraw(); } } }, "↑");
      const dn = el("button", { type: "button", onclick: () => { if (ii<imgs.length-1) { [imgs[ii+1],imgs[ii]]=[imgs[ii],imgs[ii+1]]; onChange(); idraw(); } } }, "↓");
      const rm = el("button", { type: "button", onclick: () => { imgs.splice(ii,1); onChange(); idraw(); } }, "✕");
      const urlInput = mk("url", "Paste an image URL, or upload a file →");
      const fileIn = el("input", { type: "file", accept: "image/*", style: "display:none" });
      fileIn.addEventListener("change", async () => {
        const f = fileIn.files[0]; if (!f) return;
        if (f.size > 25 * 1024 * 1024) { toast("Image too large (max 25MB)", true); return; }
        toast("Uploading " + f.name + "…");
        const dataUrl = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(f); });
        try {
          const r = await fetch("/api/upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: f.name, data: dataUrl }) });
          const j = await r.json(); if (!j.ok) throw new Error(j.error || "upload failed");
          im.url = j.url; urlInput.value = j.url; onChange(); toast("Uploaded → " + j.url);
        } catch (e) { toast("Upload failed: " + e.message + " (is server.py running?)", true); }
      });
      const upBtn = el("button", { type: "button", class: "additem", onclick: () => fileIn.click() }, "⬆ Upload file");
      row.append(
        el("div", { class: "imgfields" }, [
          el("div", { class: "imgnum" }, `image ${ii+1}`),
          el("div", { class: "urlline" }, [urlInput, upBtn, fileIn]),
          mk("caption", "Caption"),
          mk("link", "Source / credit (optional)"),
        ]),
        el("div", { class: "pbtns", style: "flex-direction:row;gap:4px" }, [up, dn, rm])
      );
      host.append(row);
    });
    host.append(el("button", { type: "button", class: "additem", onclick: () => { imgs.push({ url: "", caption: "", link: "" }); onChange(); idraw(); } }, "+ image"));
  };
  idraw();
}

function buildField(it, key, label, kind) {
  const p = it.props;
  const wrap = el("div", { class: "field" }, [el("label", {}, label)]);
  const onEdit = () => { refreshSide(); renderList(); markDirty(); };

  if (kind === "images") {
    const host = el("div");
    imageEditor(host, p, onEdit);
    wrap.append(host); return wrap;
  }
  if (kind === "readonly") {
    wrap.append(el("input", { type: "text", class: "readonly", readonly: "", value: p[key] || "" })); return wrap;
  }
  if (kind === "text") {
    const i = el("input", { type: "text", value: p[key] || "" });
    i.addEventListener("input", () => { p[key] = i.value; onEdit(); }); wrap.append(i); return wrap;
  }
  if (kind === "textarea") {
    const t = el("textarea", { rows: "3" }); t.value = p[key] || "";
    t.addEventListener("input", () => { p[key] = t.value; onEdit(); }); wrap.append(t); return wrap;
  }
  if (kind === "keys") {
    const t = el("textarea", { rows: "3" }); t.value = (p[key] || []).join("\n");
    t.addEventListener("input", () => { p[key] = t.value.split("\n").map((s) => s.trim()).filter(Boolean); onEdit(); });
    wrap.append(t); return wrap;
  }
  if (kind === "paras") {
    let arr = Array.isArray(p[key]) ? p[key].slice() : (p[key] ? [p[key]] : []);
    const host = el("div");
    const sync = () => { p[key] = arr.slice(); onEdit(); };
    const draw = () => {
      host.innerHTML = "";
      arr.forEach((para, idx) => {
        const ta = el("textarea"); ta.value = para;
        ta.addEventListener("input", () => { arr[idx] = ta.value; sync(); });
        const up = el("button", { type: "button", title: "up", onclick: () => { if (idx) { [arr[idx-1],arr[idx]]=[arr[idx],arr[idx-1]]; sync(); draw(); } } }, "↑");
        const dn = el("button", { type: "button", title: "down", onclick: () => { if (idx<arr.length-1) { [arr[idx+1],arr[idx]]=[arr[idx],arr[idx+1]]; sync(); draw(); } } }, "↓");
        const rm = el("button", { type: "button", title: "delete", onclick: () => { arr.splice(idx,1); sync(); draw(); } }, "✕");
        host.append(el("div", { class: "para" }, [ta, el("div", { class: "pbtns" }, [up, dn, rm])]));
      });
      host.append(el("button", { type: "button", class: "additem", onclick: () => { arr.push(""); sync(); draw(); } }, "+ paragraph"));
    };
    draw(); wrap.append(host); return wrap;
  }
  if (kind === "timeline") {
    let arr = Array.isArray(p[key]) ? p[key].slice() : [];
    const host = el("div");
    const sync = () => { p[key] = arr.slice(); onEdit(); };
    const draw = () => {
      host.innerHTML = "";
      arr.forEach((row, idx) => {
        const yr = el("input", { type: "text", class: "yr", value: row.year != null ? row.year : "" });
        yr.addEventListener("input", () => { const n = parseInt(yr.value); arr[idx] = { ...arr[idx], year: isNaN(n) ? yr.value : n }; sync(); });
        const ev = el("textarea", { class: "ev", rows: "2" }); ev.value = row.event || "";
        ev.addEventListener("input", () => { arr[idx] = { ...arr[idx], event: ev.value }; sync(); });
        const up = el("button", { type: "button", onclick: () => { if (idx) { [arr[idx-1],arr[idx]]=[arr[idx],arr[idx-1]]; sync(); draw(); } } }, "↑");
        const dn = el("button", { type: "button", onclick: () => { if (idx<arr.length-1) { [arr[idx+1],arr[idx]]=[arr[idx],arr[idx+1]]; sync(); draw(); } } }, "↓");
        const rm = el("button", { type: "button", onclick: () => { arr.splice(idx,1); sync(); draw(); } }, "✕");
        host.append(el("div", { class: "tl-row" }, [yr, ev, el("div", { class: "pbtns" }, [up, dn, rm])]));
      });
      host.append(el("button", { type: "button", class: "additem", onclick: () => { arr.push({ year: "", event: "" }); sync(); draw(); } }, "+ entry"));
    };
    draw(); wrap.append(host); return wrap;
  }
  if (kind === "chapters") {
    let arr = Array.isArray(p[key]) ? p[key] : (p[key] = []);
    const host = el("div");
    const sync = () => { p[key] = arr; onEdit(); };
    const draw = () => {
      host.innerHTML = "";
      arr.forEach((ch, idx) => {
        const box = el("div", { class: "chapter" });
        const up = el("button", { type: "button", onclick: () => { if (idx) { [arr[idx-1],arr[idx]]=[arr[idx],arr[idx-1]]; sync(); draw(); } } }, "↑");
        const dn = el("button", { type: "button", onclick: () => { if (idx<arr.length-1) { [arr[idx+1],arr[idx]]=[arr[idx],arr[idx+1]]; sync(); draw(); } } }, "↓");
        const rm = el("button", { type: "button", onclick: () => { arr.splice(idx,1); sync(); draw(); } }, "✕");
        const ctrls = el("div", { class: "pbtns", style: "flex-direction:row;gap:4px" }, [up, dn, rm]);
        if ("ref" in ch) {
          box.append(el("div", { class: "chead" }, [el("span", { class: "reftag" }, `Chapter ${idx+1} · reference`), ctrls]));
          const i = el("input", { type: "text", value: ch.ref || "" });
          i.addEventListener("input", () => { ch.ref = i.value; sync(); }); box.append(i);
        } else {
          box.append(el("div", { class: "chead" }, [el("span", { class: "reftag" }, `Chapter ${idx+1}`), ctrls]));
          const h = el("input", { type: "text", value: ch.heading || "" }); h.addEventListener("input", () => { ch.heading = h.value; sync(); });
          box.append(el("div", { class: "field" }, [el("label", {}, "Heading"), h]));
          // body as paragraphs
          let body = Array.isArray(ch.body) ? ch.body : (ch.body ? [ch.body] : []);
          const bhost = el("div");
          const bsync = () => { ch.body = body.slice(); sync(); };
          const bdraw = () => {
            bhost.innerHTML = "";
            body.forEach((para, bi) => {
              const ta = el("textarea"); ta.value = para;
              ta.addEventListener("input", () => { body[bi] = ta.value; bsync(); });
              const brm = el("button", { type: "button", onclick: () => { body.splice(bi,1); bsync(); bdraw(); } }, "✕");
              bhost.append(el("div", { class: "para" }, [ta, el("div", { class: "pbtns" }, [brm])]));
            });
            bhost.append(el("button", { type: "button", class: "additem", onclick: () => { body.push(""); bsync(); bdraw(); } }, "+ paragraph"));
          };
          bdraw();
          box.append(el("div", { class: "field" }, [el("label", {}, "Body"), bhost]));
          const ihost = el("div");
          imageEditor(ihost, ch, sync);
          box.append(el("div", { class: "field" }, [el("label", {}, "Images (multiple = swipeable carousel)"), ihost]));
        }
        host.append(box);
      });
      host.append(el("button", { type: "button", class: "additem", onclick: () => { arr.push({ heading: "", body: [""] }); sync(); draw(); } }, "+ text chapter"));
      host.append(" ");
      host.append(el("button", { type: "button", class: "additem", onclick: () => { arr.push({ ref: "" }); sync(); draw(); } }, "+ reference chapter"));
    };
    draw(); wrap.append(host); return wrap;
  }
  return wrap;
}

// ---- side pane: fact links, lint, preview -------------------------------
function collectText(it) {
  const p = it.props; const parts = [];
  for (const k of ["name", "title", "summary", "role"]) if (p[k]) parts.push(p[k]);
  for (const k of ["body", "stories"]) if (Array.isArray(p[k])) parts.push(p[k].join("\n")); else if (p[k]) parts.push(p[k]);
  if (Array.isArray(p.timeline)) parts.push(p.timeline.map((t) => t.event).join("\n"));
  if (Array.isArray(p.chapters)) for (const c of p.chapters) { if (c.heading) parts.push(c.heading); if (c.body) parts.push(Array.isArray(c.body) ? c.body.join("\n") : c.body); if (Array.isArray(c.images)) for (const im of c.images) { if (im.caption) parts.push(im.caption); } else if (c.image_caption) parts.push(c.image_caption); }
  return parts.join("\n");
}
function hasAiTell(t) { const l = t.toLowerCase(); return AI_TELLS.some((w) => l.includes(w)) || /\bnot\b[^.]{0,40}\bbut\b/i.test(t); }

function refreshSide() {
  const it = curItem(); if (!it) return;
  // fact links
  const name = encodeURIComponent(it.name + " Sydney");
  const links = [
    ["Google", `https://www.google.com/search?q=${name}`],
    ["Wikipedia", `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(it.name)}`],
    ["Dict. of Sydney", `https://dictionaryofsydney.org/search/google?query=${encodeURIComponent(it.name)}`],
    ["Trove", `https://trove.nla.gov.au/search/category/newspapers?keyword=${encodeURIComponent(it.name)}`],
    ["State Library", `https://collection.sl.nsw.gov.au/search?text=${encodeURIComponent(it.name)}`],
  ];
  $("#factlinks").innerHTML = "";
  for (const [t, u] of links) $("#factlinks").append(el("a", { href: u, target: "_blank", rel: "noopener" }, t));

  // lint
  const text = collectText(it);
  const out = $("#lint"); out.innerHTML = "";
  const ems = (text.match(/—/g) || []).length;
  const semis = (text.match(/;/g) || []).length;
  const tells = AI_TELLS.filter((w) => text.toLowerCase().includes(w));
  if (/\bnot\b[^.]{0,40}\bbut\b/i.test(text)) tells.push("'not X but Y'");
  let issues = 0;
  if (ems) { out.append(el("div", { class: "lint-item", html: `<b>${ems}</b> em dash${ems>1?"es":""} (—). Replace with full stops or commas.` })); issues += ems; }
  if (semis) { out.append(el("div", { class: "lint-item", html: `<b>${semis}</b> semicolon${semis>1?"s":""}. Prefer full stops.` })); }
  if (tells.length) { out.append(el("div", { class: "lint-item", html: `AI tells: <b>${esc(tells.join(", "))}</b>` })); issues += tells.length; }
  if (!out.children.length) out.append(el("div", { class: "clean" }, "✓ clean"));
  $("#lint-badge").textContent = ems ? String(ems) : "";

  // preview
  $("#preview").innerHTML = previewHtml(it);
}
function hi(s) {
  return esc(s)
    .replace(/—/g, '<span class="em">—</span>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*(?!\s)([^*\n]+?)\*/g, "$1<em>$2</em>")
    .replace(/(^|[^\w])_(?!\s)([^_\n]+?)_(?![\w])/g, "$1<em>$2</em>");
}
function paras(v) { const a = Array.isArray(v) ? v : (v ? [v] : []); return a.map((x) => `<p>${hi(x)}</p>`).join(""); }
function previewHtml(it) {
  const p = it.props;
  let h = "";
  const media = Array.isArray(p.images) ? p.images.filter((m) => m && m.url) : (p.image ? [{ url: p.image, caption: p.image_caption }] : []);
  if (media.length) {
    if (media.length > 1) h += `<p class="muted" style="font-size:12px">${media.length} images · carousel</p>`;
    for (const m of media) h += `<img src="${esc(m.url)}" alt="" onerror="this.style.opacity=.25" title="${esc(m.caption)}"/>`;
  }
  h += `<h3>${hi(p.name || p.title || "")}</h3>`;
  if (it.type === "person" && p.place) h += `<p class="muted"><strong>Place</strong> ${hi(p.place)}</p>`;
  if (p.summary) h += `<p><em>${hi(p.summary)}</em></p>`;
  if (Array.isArray(p.timeline) && p.timeline.length)
    h += `<ul class="tl">${p.timeline.map((t) => `<li><span class="y">${esc(t.year)}</span><span>${hi(t.event)}</span></li>`).join("")}</ul>`;
  if (p.body) h += paras(p.body);
  if (Array.isArray(p.stories)) h += paras(p.stories);
  if (Array.isArray(p.chapters)) h += `<p class="muted">${p.chapters.length} chapters</p>` + p.chapters.filter((c)=>!c.ref).map((c)=>`<h3>${hi(c.heading||"")}</h3>${paras(c.body)}`).join("");
  if (p.source) h += `<p class="muted">Sources: ${hi(p.source)}</p>`;
  return h;
}

// ---- review state + save ------------------------------------------------
function setReview(key, patch) {
  review[key] = { reviewed: false, note: "", ...(review[key] || {}), ...patch };
  if (!review[key].reviewed && !review[key].note) delete review[key];
  renderList(); renderTabs();
  saveFile("review-state.json", review, true); // silent autosave
}
async function saveActiveFile() {
  const c = COL[activeTab];
  await saveFile(c.file, c.raw, false);
}
async function publishLive() {
  if (!$("#save-btn").disabled && !window.confirm("You have unsaved changes. Publish anyway? (They won't go live unless you Save first.)")) return;
  const btn = $("#publish-btn"); btn.disabled = true; btn.textContent = "Publishing…";
  try {
    const res = await fetch("/api/publish", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: "Update content via editor" }) });
    const j = await res.json();
    if (!j.ok) throw new Error(j.error || "publish failed");
    toast(j.detail);
  } catch (e) { toast("Publish failed: " + e.message, true); }
  btn.disabled = false; btn.textContent = "Publish ↑";
}
async function saveFile(file, data, silent) {
  try {
    const res = await fetch("/api/save", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file, data }) });
    const j = await res.json();
    if (!j.ok) throw new Error(j.error || "save failed");
    if (!silent) {
      dirty.delete(file);
      const s = $("#save-state"); s.textContent = `saved ${file} (${j.bytes} bytes${j.em_dashes ? `, ${j.em_dashes} em dashes!` : ""})`;
      s.classList.toggle("dirty", j.em_dashes > 0);
      $("#save-btn").disabled = true;
      toast(j.em_dashes ? `Saved, but ${j.em_dashes} em dashes remain in file` : `Saved ${file}`, j.em_dashes > 0);
    }
  } catch (e) {
    if (!silent) toast("Save failed: " + e.message + " — is server.py running?", true);
    else console.warn("review autosave failed", e);
  }
}
function toast(msg, err) {
  const t = $("#toast"); t.textContent = msg; t.className = "show" + (err ? " err" : "");
  clearTimeout(toast._t); toast._t = setTimeout(() => (t.className = ""), 3200);
}

// ---- keyboard -----------------------------------------------------------
function onKey(e) {
  if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); if (!$("#save-btn").disabled) saveActiveFile(); return; }
  // Bold / italic in any textarea: wrap the selection in markdown markers.
  if ((e.metaKey || e.ctrlKey) && (e.key === "b" || e.key === "i") && e.target.tagName === "TEXTAREA") {
    e.preventDefault();
    const ta = e.target, m = e.key === "b" ? "**" : "*";
    const s = ta.selectionStart, en = ta.selectionEnd, sel = ta.value.slice(s, en);
    ta.setRangeText(m + sel + m, s, en, "select");
    if (!sel) ta.setSelectionRange(s + m.length, s + m.length);
    ta.dispatchEvent(new Event("input", { bubbles: true }));
    return;
  }
  if (e.altKey && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
    e.preventDefault();
    const lis = [...$("#item-list").children];
    const idx = lis.findIndex((li) => li.classList.contains("active"));
    const next = e.key === "ArrowDown" ? idx + 1 : idx - 1;
    if (lis[next]) lis[next].click();
  }
}

boot().catch((e) => { $("#save-state").textContent = "load error: " + e.message; console.error(e); });

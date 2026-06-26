#!/usr/bin/env python3
"""Editor + save server for Sydney, Layered.

Serves the whole web/ directory (so the map at / still works) AND accepts
POST /api/save to write data files back to disk with a timestamped backup.

Run:  python3 web/editor/server.py [port]   (default 8091)
Then open:  http://localhost:8091/editor/
"""
import http.server, json, os, shutil, datetime, sys, base64, re, subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # .../web
REPO = os.path.dirname(ROOT)  # git repo root
DATA = os.path.join(ROOT, "data")
BACKUPS = os.path.join(DATA, ".backups")
IMGDIR = os.path.join(ROOT, "img")
IMG_EXT = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif"}
# Only these files may be written, and how to format each on save.
ALLOWED = {
    "people.geojson": "compact",
    "stories.geojson": "compact",
    "buildings.geojson": "compact",
    "streets.geojson": "compact",
    "dossiers.json": "indent",
    "tours.json": "indent",
    "review-state.json": "indent",
}


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=ROOT, **k)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def _json(self, code, obj):
        body = json.dumps(obj).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        route = self.path.split("?")[0]
        if route == "/api/upload":
            return self.do_upload()
        if route == "/api/publish":
            return self.do_publish()
        if route != "/api/save":
            self._json(404, {"ok": False, "error": "not found"})
            return
        try:
            n = int(self.headers.get("Content-Length", 0))
            payload = json.loads(self.rfile.read(n))
            fname = payload["file"]
            data = payload["data"]
            if fname not in ALLOWED:
                raise ValueError(f"file not allowed: {fname}")
            # Re-serialise (also validates the structure is JSON-clean).
            if ALLOWED[fname] == "indent":
                text = json.dumps(data, ensure_ascii=False, indent=1)
            else:
                text = json.dumps(data, ensure_ascii=False)
            # em-dash guard report (do not block, just report back)
            em = text.count("—")
            path = os.path.join(DATA, fname)
            os.makedirs(BACKUPS, exist_ok=True)
            if os.path.exists(path):
                ts = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
                shutil.copy2(path, os.path.join(BACKUPS, f"{fname}.{ts}.bak"))
                # keep only the 20 most recent backups per file
                same = sorted(b for b in os.listdir(BACKUPS) if b.startswith(fname + "."))
                for old in same[:-20]:
                    os.remove(os.path.join(BACKUPS, old))
            with open(path, "w", encoding="utf-8") as f:
                f.write(text)
            self._json(200, {"ok": True, "file": fname, "bytes": len(text), "em_dashes": em})
        except Exception as e:
            self._json(400, {"ok": False, "error": str(e)})

    def do_publish(self):
        # git add -A && commit && push from the repo root -> triggers the Pages rebuild.
        try:
            n = int(self.headers.get("Content-Length", 0))
            msg = "Update content via editor"
            if n:
                try: msg = (json.loads(self.rfile.read(n)).get("message") or msg)[:200]
                except Exception: pass
            def run(*a):
                return subprocess.run(a, cwd=REPO, capture_output=True, text=True, timeout=300)
            run("git", "add", "-A")
            c = run("git", "commit", "-m", msg)
            committed = c.returncode == 0
            if not committed and "nothing to commit" not in (c.stdout + c.stderr):
                raise RuntimeError((c.stderr or c.stdout).strip())
            if committed:
                p = run("git", "push")
                if p.returncode != 0:
                    raise RuntimeError((p.stderr or p.stdout).strip())
            self._json(200, {"ok": True, "committed": committed,
                             "detail": "Published — the live site will rebuild in ~1 minute." if committed else "Nothing new to publish."})
        except Exception as e:
            self._json(400, {"ok": False, "error": str(e)})

    def do_upload(self):
        # Accept a base64 data URL {name, data} and save it under web/img/. Returns {url:"/img/..."}.
        try:
            n = int(self.headers.get("Content-Length", 0))
            if n > 25 * 1024 * 1024:
                raise ValueError("file too large (max 25MB)")
            payload = json.loads(self.rfile.read(n))
            name = os.path.basename(payload.get("name", "image"))
            data = payload["data"]
            if data.startswith("data:") and "," in data:
                data = data.split(",", 1)[1]
            raw = base64.b64decode(data)
            ext = os.path.splitext(name)[1].lower()
            if ext not in IMG_EXT:
                raise ValueError(f"not an image type: {ext or '(none)'}")
            safe = re.sub(r"[^A-Za-z0-9._-]", "_", name) or ("image" + ext)
            os.makedirs(IMGDIR, exist_ok=True)
            base, e = os.path.splitext(safe)
            dest = os.path.join(IMGDIR, safe)
            k = 1
            while os.path.exists(dest):  # don't overwrite an existing file
                dest = os.path.join(IMGDIR, f"{base}-{k}{e}"); k += 1
            with open(dest, "wb") as f:
                f.write(raw)
            self._json(200, {"ok": True, "url": "/img/" + os.path.basename(dest), "bytes": len(raw)})
        except Exception as e:
            self._json(400, {"ok": False, "error": str(e)})


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8091
    httpd = http.server.ThreadingHTTPServer(("0.0.0.0", port), Handler)
    print(f"Sydney, Layered editor + save server")
    print(f"  serving:  {ROOT}")
    print(f"  data dir: {DATA}")
    print(f"  backups:  {BACKUPS}")
    print(f"  open ->   http://localhost:{port}/editor/")
    print(f"  map  ->   http://localhost:{port}/")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nstopped")

#!/usr/bin/env python3
"""Local dev server for Lumberjack: serves the repo root with caching disabled, so edits show up on reload.

It also accepts POST /api/sfx-defs from this machine only, so the sound studio (sounds.html) can save js/sfx-defs.js.
"""
import functools
import http.server
import os
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SFX_FILE = ROOT / "js" / "sfx-defs.js"
SFX_PREFIX = "'use strict';"


class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_POST(self):
        if self.path != "/api/sfx-defs":
            return self.send_error(404)
        if self.client_address[0] not in ("127.0.0.1", "::1", "::ffff:127.0.0.1"):
            return self.send_error(403, "Saving is only allowed from this machine")
        length = int(self.headers.get("Content-Length") or 0)
        if length <= 0 or length > 512 * 1024:
            return self.send_error(413)
        text = self.rfile.read(length).decode("utf-8")
        if not text.startswith(SFX_PREFIX) or "LJ.SFX_DEFAULTS = {" not in text:
            return self.send_error(400, "Not a sound definitions file")
        tmp = SFX_FILE.with_suffix(".js.tmp")
        tmp.write_text(text, encoding="utf-8")
        os.replace(tmp, SFX_FILE)  # atomic: the game never reads a half-written file
        self.send_response(204)
        self.end_headers()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5173
    handler = functools.partial(NoCache, directory=str(ROOT))
    print(f"Lumberjack: http://localhost:{port}  (Ctrl+C to stop)")
    print(f"Sound studio: http://localhost:{port}/sounds.html")
    http.server.ThreadingHTTPServer(("", port), handler).serve_forever()

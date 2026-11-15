#!/usr/bin/env python3
"""Local dev server for Lumberjack: serves the repo root with caching disabled, so edits show up on reload.

It also accepts writes from this machine only, so the recording booth (voices.html) can save its work:
  POST   /api/voice/<key>  saves audio/voice/<key>.wav
  DELETE /api/voice/<key>  removes that recording
audio/voice/manifest.json ({key: version}) is rebuilt after every change; the game reads it to know what can be played.
"""
import functools
import http.server
import os
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
VOICE_DIR = ROOT / "audio" / "voice"
VOICE_KEY = re.compile(r"^[a-z0-9_-]{1,100}$")
MAX_WAV = 4 * 1024 * 1024
LOCAL = ("127.0.0.1", "::1", "::ffff:127.0.0.1")


def write_atomic(path, data):
    tmp = path.with_name(path.name + ".tmp")
    tmp.write_bytes(data)
    os.replace(tmp, path)  # atomic: the game never reads a half-written file


def write_manifest():
    """List every recording with its modified time, which the game uses to bust its cache."""
    VOICE_DIR.mkdir(parents=True, exist_ok=True)
    m = {f.stem: int(f.stat().st_mtime) for f in sorted(VOICE_DIR.glob("*.wav"))}
    write_atomic(VOICE_DIR / "manifest.json", json.dumps(m, indent=1).encode())


class NoCache(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        # A separate URL space keeps playground source out of an already-active
        # production service worker's cache, including workers from older releases.
        if path.startswith('/__playground__/'):
            path = path.removeprefix('/__playground__')
        return super().translate_path(path)

    def send_head(self):
        path = pathlib.Path(self.translate_path(self.path))
        relative = path.relative_to(ROOT)
        if any(part.startswith('.') for part in relative.parts) or not path.resolve().is_relative_to(ROOT):
            self.send_error(404)
            return None
        return super().send_head()

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def body(self, limit):
        length = int(self.headers.get("Content-Length") or 0)
        if length <= 0 or length > limit:
            self.send_error(413)
            return None
        return self.rfile.read(length)

    def local_only(self):
        if self.client_address[0] in LOCAL:
            return True
        self.send_error(403, "Saving is only allowed from this machine")
        return False

    def voice_key(self):
        key = self.path.removeprefix("/api/voice/")
        return key if self.path.startswith("/api/voice/") and VOICE_KEY.match(key) else None

    def done(self):
        self.send_response(204)
        self.end_headers()

    def do_POST(self):
        if not self.local_only():
            return
        key = self.voice_key()
        if key is None:
            return self.send_error(404)
        data = self.body(MAX_WAV)
        if data is None:
            return
        if data[:4] != b"RIFF" or data[8:12] != b"WAVE":
            return self.send_error(400, "Not a WAV file")
        VOICE_DIR.mkdir(parents=True, exist_ok=True)
        write_atomic(VOICE_DIR / (key + ".wav"), data)
        write_manifest()
        self.done()

    def do_DELETE(self):
        if not self.local_only():
            return
        key = self.voice_key()
        if key is None:
            return self.send_error(404)
        (VOICE_DIR / (key + ".wav")).unlink(missing_ok=True)
        write_manifest()
        self.done()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5173
    handler = functools.partial(NoCache, directory=str(ROOT))
    print(f"Lumberjack: http://localhost:{port}  (Ctrl+C to stop)")
    print(f"Recording booth: http://localhost:{port}/voices.html")
    print(f"Testing playground: http://localhost:{port}/playground.html")
    http.server.ThreadingHTTPServer(("127.0.0.1", port), handler).serve_forever()

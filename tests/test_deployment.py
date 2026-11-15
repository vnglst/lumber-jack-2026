"""Release-boundary checks; no network sockets or third-party packages needed."""
import importlib.util
import io
import json
import re
import contextlib
import runpy
from pathlib import Path
import shutil
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parent.parent


def load(name):
    spec = importlib.util.spec_from_file_location(name, ROOT / 'tools' / (name + '.py'))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class DevelopmentServer(unittest.TestCase):
    def test_server_binds_only_to_loopback(self):
        with patch('http.server.ThreadingHTTPServer') as server, patch('sys.argv', ['serve.py', '5196']):
            with contextlib.redirect_stdout(io.StringIO()):
                runpy.run_path(str(ROOT / 'tools/serve.py'), run_name='__main__')
            self.assertEqual(server.call_args.args[0], ('127.0.0.1', 5196))

    def test_private_files_are_not_served(self):
        server = load('serve')
        class Handler(server.NoCache):
            def send_response(self, code, message=None): self.status = code
            def send_header(self, *args): pass
            def end_headers(self): pass
            def log_message(self, *args): pass

        for path in ['/.git', '/%2egit', '/.env', '/.claude/launch.json', '/index.html',
                     '/__playground__/.git/config', '/__playground__/%2eenv',
                     '/__playground__/index.html', '/__playground__/js/game.js']:
            with self.subTest(path=path):
                handler = Handler.__new__(Handler)
                handler.directory = str(ROOT)
                handler.path = path
                handler.headers = {}
                handler.wfile = io.BytesIO()
                handler.command = 'GET'
                handler.extra_response_headers = None
                file = handler.send_head()
                if file:
                    file.close()
                public = path in ['/index.html', '/__playground__/index.html', '/__playground__/js/game.js']
                self.assertEqual(handler.status, 200 if public else 404)

    def test_playground_alias_serves_current_source(self):
        server = load('serve')
        handler = server.NoCache.__new__(server.NoCache)
        handler.directory = str(ROOT)
        for asset in ['index.html', 'js/game.js', 'css/style.css', 'audio/voice/manifest.json']:
            self.assertEqual(Path(handler.translate_path('/__playground__/' + asset)), ROOT / asset)


class ProductionPackage(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name) / 'source'
        shutil.copytree(ROOT, self.root, ignore=shutil.ignore_patterns('.git', 'dist', '__pycache__'))
        self.package = load('package')

    def test_package_contains_game_but_no_development_or_unlisted_files(self):
        (self.root / 'js' / 'secret.js').write_text('private fixture')
        (self.root / 'audio' / 'voice' / 'private-take.wav').write_bytes(b'private fixture')
        (self.root / '.env').write_text('private fixture')
        output = self.package.build(self.root)
        files = {p.relative_to(output).as_posix() for p in output.rglob('*') if p.is_file()}
        for needed in ['index.html', 'css/style.css', 'js/main.js', 'js/save.js', 'sw.js',
                       'manifest.webmanifest', 'assets/social-card.png', 'audio/voice/manifest.json',
                       'audio/CREDITS.md', 'LICENSE']:
            self.assertIn(needed, files)
        for forbidden in ['voices.html', 'playground.html', 'sprites.html', 'README.md', '.env',
                          'js/voices-studio.js', 'js/playground.js', 'js/secret.js',
                          'audio/voice/private-take.wav']:
            self.assertNotIn(forbidden, files)
        self.assertFalse(any(p.startswith(('.git', 'tools/', 'tests/', 'docs/', 'audio/voice-defaults/')) for p in files))
        manifest = json.loads((output / 'audio/voice/manifest.json').read_text())
        for key in manifest:
            self.assertTrue((output / 'audio/voice' / (key + '.wav')).is_file())
        for path in re.findall(r"'(\./[^']*)'", (output / 'sw.js').read_text()):
            self.assertTrue((output / path).exists(), 'Offline shell missing: ' + path)
        for icon in json.loads((output / 'manifest.webmanifest').read_text())['icons']:
            self.assertTrue((output / icon['src']).is_file())
        # Rebuilding must remove files that no longer belong in the deployment.
        (output / 'voices.html').write_text('stale fixture')
        self.package.build(self.root)
        self.assertFalse((output / 'voices.html').exists())

    def test_missing_recording_fails_without_destroying_previous_package(self):
        output = self.package.build(self.root)
        manifest = json.loads((self.root / 'audio/voice/manifest.json').read_text())
        (self.root / 'audio/voice' / (next(iter(manifest)) + '.wav')).unlink()
        with self.assertRaises(ValueError):
            self.package.build(self.root)
        self.assertTrue((output / 'index.html').exists())

    def test_symlink_cannot_publish_a_file_outside_the_source(self):
        outside = Path(self.temp.name) / 'outside.js'
        outside.write_text('private fixture')
        script = self.root / 'js/main.js'
        script.unlink()
        script.symlink_to(outside)
        with self.assertRaises(ValueError):
            self.package.build(self.root)

    def test_output_symlink_is_not_followed_or_deleted(self):
        outside = Path(self.temp.name) / 'keep'
        outside.mkdir()
        marker = outside / 'keep.txt'
        marker.write_text('keep')
        (self.root / 'dist').symlink_to(outside, target_is_directory=True)
        with self.assertRaises(ValueError):
            self.package.build(self.root)
        self.assertEqual(marker.read_text(), 'keep')


if __name__ == '__main__':
    unittest.main()

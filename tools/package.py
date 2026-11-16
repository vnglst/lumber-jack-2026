#!/usr/bin/env python3
"""Copy the static game into dist/, without development tools or a runtime build."""
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import shutil
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent.parent


class Resources(HTMLParser):
    def __init__(self):
        super().__init__()
        self.paths = set()

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        url = attrs.get('src') if tag == 'script' else None
        if tag == 'link' and set(attrs.get('rel', '').split()) & {
            'stylesheet', 'icon', 'apple-touch-icon', 'manifest'
        }:
            url = attrs.get('href')
        if url and not urlsplit(url).netloc and not urlsplit(url).scheme:
            self.paths.add(urlsplit(url).path)


def build(root=ROOT):
    root = root.resolve()
    output = root / 'dist'
    if output.is_symlink():
        raise ValueError('dist must not be a symlink')
    resources = Resources()
    resources.feed((root / 'index.html').read_text())
    files = resources.paths | {
        'index.html', 'sw.js', 'manifest.webmanifest', 'robots.txt', 'sitemap.xml',
        'audio/song/im-a-lumberjack.mp3', 'audio/song/hes-a-lumberjack.mp3',
        'assets/social-card.png', 'LICENSE', 'audio/CREDITS.md', 'audio/voice/manifest.json'
    }
    manifest = json.loads((root / 'manifest.webmanifest').read_text())
    files.update(icon['src'] for icon in manifest['icons'])
    voices = json.loads((root / 'audio/voice/manifest.json').read_text())
    for key in voices:
        if not re.fullmatch(r'[a-z0-9_-]{1,100}', key):
            raise ValueError('Invalid recording key in voice manifest')
        files.add('audio/voice/' + key + '.wav')
    # Validate before removing an earlier package. Never copy whole source directories.
    for name in files:
        path = root / name
        if Path(name).is_absolute() or any(p.startswith('.') for p in Path(name).parts):
            raise ValueError('Invalid production path: ' + name)
        if not path.resolve().is_relative_to(root) or not path.is_file():
            raise ValueError('Missing or external production file: ' + name)
    if output.exists():
        shutil.rmtree(output)
    output.mkdir()
    for name in sorted(files):
        target = output / name
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(root / name, target)
    return output


if __name__ == '__main__':
    try:
        output = build()
    except (ValueError, OSError) as error:
        raise SystemExit(str(error))
    count = sum(p.is_file() for p in output.rglob('*'))
    print(f'Packaged {count} static files in {output.name}/')

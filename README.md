# Lumberjack

A 2D pixel-art browser game about cutting down a forest, building a logging village and automating it, until the land is cleared. What it was cleared for is revealed at the end.

![Concept art](docs/concept-art.png)

## Play

```bash
make
```

Opens the game at http://localhost:5173 (needs Python 3). No build step and no dependencies: it is plain HTML, CSS and JavaScript, so any static file server works too.

The game saves itself in the browser as you play. Tap **?** in the game for the controls.

## Other commands

| Command | What it does |
| --- | --- |
| `make` | Start the game and open it in the browser |
| `make check` | Syntax-check every script (needs Node) |
| `make help` | List the commands |

`sprites.html` shows every sprite in the game.

`sounds.html` is the sound studio: play, tweak and invent the game's synthesized sound effects. Tweaks are drafts that an open game tab plays straight away for testing; **Save** writes them to `js/sfx-defs.js` (needs `make` running), **Revert** drops them, and every save keeps the version it replaced so you can restore it.

## Layout

```
index.html     the game
sprites.html   sprite sheet
sounds.html    sound studio
css/           styles
js/            game code (loaded in order by index.html)
docs/          game plan and concept art
tools/         dev server (also saves sounds from the studio)
```

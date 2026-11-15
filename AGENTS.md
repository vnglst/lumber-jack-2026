# Notes for coding agents

Lumberjack is a browser game in plain JavaScript: no build step, no dependencies, no modules. The design brief is `docs/GAME-PLAN.md`; `docs/REQUIREMENTS.md` is the decision log of every later request, in order, and where it differs from the game plan, the later entry wins. Read both before changing gameplay. Keep it up to date as you work: whenever the user asks for a feature or a change, or makes a design decision, add an entry at the end of `REQUIREMENTS.md` as part of the same change, with the user's words quoted, the requirements as bullets and any *Decision:* notes, and add a row to its index table. Never rewrite an old entry; only give it a **Status** line saying which entry superseded it. Leave out requests that only ask to commit or merge.

## Running and checking

- `make` serves the game at http://localhost:5173 with caching disabled (`tools/serve.py`).
- `make check` syntax-checks all scripts. `make test` also runs the tests, which step the real simulation without a browser (`tests/harness.cjs`).
- `make playtest SEEDS="1 2 3"` plays whole campaigns on those map seeds with a scripted player (`tests/campaign.cjs`) and reports pacing, losses, debt and stalls. Run it after changing rules: it finds dead ends that single-rule tests miss. A campaign is deterministic for its seed, so identical reports before and after a refactor mean behaviour did not change.
- Check the interface in the browser, or step the simulation from the console (`LJ.update(0.05)` in a loop, then inspect `LJ.G`).

## Code

- Everything hangs off the global `LJ`; the game state is `LJ.G`. Each file is an IIFE that adds to `LJ`.
- Scripts load in the order listed in `index.html`, and later files depend on earlier ones:
  - `util`, `sfx-defs`, `sound`, `lines`, `voice`, `songs`, `music`
  - `sprites`, `art`, `sprites2` (all art is drawn in code, nothing is loaded from image files)
  - `world` (map generation, ground shader)
  - `game` (simulation), `critters` (peaceful wildlife and butterflies, no effect on the rules)
  - `combat`, `render`, `ending`, `ui`, `title` (the opening screen)
  - `save`, `main`
- Rules live in tables in `game.js`: `SHOP`, `TIERS` (base upgrades), `BLD` (buildings), `VEH` (vehicles) and `FOE` (enemies). Prefer adding a field to a table over special-casing a kind in code.
- The map is 104×72 tiles of 16 px. World layers are typed arrays on `G.world`, indexed by tile. Use `colOf(i)` / `rowOf(i)` (also on `LJ`) for a tile's column and row instead of writing the arithmetic out; in `game.js`, `midX(i)` / `feetY(i)` give the pixel where a unit on that tile stands.
- Sound effects are data in `js/sfx-defs.js` (stacks of tone/noise layers) played by `js/sound.js`. Add a sound by adding an entry there and calling `LJ.sfx('name')`.
- Music is data too: scores in `js/songs.js` (`LJ.SONGS`, a text notation explained at the top of the file) played by the sequencer and synthesized instruments in `js/music.js`. `main.js` picks the song for the moment (`title`, `road`, `work`, `deep`, `raid`, `ending`). `tests/music.test.cjs` checks that every score parses and its tracks line up.
- Everything a character says lives in `js/lines.js` (`LJ.LINES`, plus `LJ.CUES` for wordless sounds like war cries). `say()` shows the text and `voice.js` plays the recording from `audio/voice/` when one exists, keyed by the line's text, so rewording a line means re-recording it. Record them in `voices.html` (`js/voices-studio.js`). A new line goes in `lines.js` and is picked up by the booth automatically.
- Saves (`save.js`) store only what changes during play and regenerate the map from its seed. Bump `VERSION` there if the saved shape changes.

## Conventions

- Keep the ending a surprise: nothing in the UI before the ending should hint at the data center. The opening story says an AI took the player's job; it must not say what the land is for.
- The game is set in Finland: spruce, Scots pine and birch; reindeer, swans, wolves and bears; red wooden houses with white trim; prices in euros.
- Match the existing pixel-art style: light from the top-left, dark outlines, small palettes.

# Notes for coding agents

Lumberjack is a browser game in plain JavaScript: no build step, no dependencies, no modules. The design brief is `docs/GAME-PLAN.md`.

## Running and checking

- `make` serves the game at http://localhost:5173 with caching disabled (`tools/serve.py`).
- `make check` syntax-checks all scripts. There is no test suite: check behaviour in the browser, or by stepping the simulation from the console (`LJ.update(0.05)` in a loop, then inspect `LJ.G`).

## Code

- Everything hangs off the global `LJ`; the game state is `LJ.G`. Each file is an IIFE that adds to `LJ`.
- Scripts load in the order listed in `index.html`, and later files depend on earlier ones:
  - `util`, `sound`
  - `sprites`, `art`, `sprites2` (all art is drawn in code, nothing is loaded from image files)
  - `world` (map generation, ground shader)
  - `game` (simulation)
  - `combat`, `render`, `ending`, `ui`
  - `save`, `main`
- Rules live in tables in `game.js`: `SHOP`, `TIERS` (base upgrades), `BLD` (buildings), `VEH` (vehicles) and `FOE` (enemies). Prefer adding a field to a table over special-casing a kind in code.
- The map is 104×72 tiles of 16 px. World layers are typed arrays on `G.world`.
- Saves (`save.js`) store only what changes during play and regenerate the map from its seed. Bump `VERSION` there if the saved shape changes.

## Conventions

- Keep the ending a surprise: nothing in the UI before the ending should hint at the data center.
- Match the existing pixel-art style: light from the top-left, dark outlines, small palettes.

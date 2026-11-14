# Notes for coding agents

Lumberjack is a browser game in plain JavaScript: no build step, no dependencies, no modules. The design brief is `docs/GAME-PLAN.md`; `docs/REQUIREMENTS.md` is the decision log of every later request, in order, and where it differs from the game plan, the later entry wins. Read both before changing gameplay; reuse that context during the task, reading only new or relevant entries again. Keep the decision log up to date as you work: whenever the user asks for a feature or a change, or makes a design decision, add an entry at the end of `REQUIREMENTS.md` as part of the same change, with the user's words quoted, the requirements as bullets and any *Decision:* notes, and add a row to its index table. Never rewrite an old entry; only give it a **Status** line saying which entry superseded it. Leave out requests that only ask to commit or merge.

## Running and checking

- `make` serves the game at http://localhost:5173 with caching disabled (`tools/serve.py`).
- `make check` syntax-checks the scripts; `node --test tests/*.test.cjs` runs the dependency-free regression suite. `tests/harness.cjs` steps the real simulation with rendering and sound stubbed. Browser checks cover what those stubs cannot: layout, input, rendering and actual audio.
- For a bug, capture a focused failing check before editing. Run affected checks while iterating, then syntax and the full suite once on the final merged code; repeat only after changes or failures. Keep test output to the summary and relevant failures.
- Browser checks: serve a worktree with `python3 tools/serve.py <port>`. Give concurrent servers distinct ports and coordinate browser ownership. Use an isolated test context if a shared profile is busy. For live edits, bypass/unregister the service worker; test installed/offline behaviour separately with its cache enabled.
- For HUD/navigation changes, check a full late-game HUD, an active market offer and the shop at narrow portrait and landscape sizes, as well as the opening screen.

## Code

- Everything hangs off the global `LJ`; the game state is `LJ.G`. Each file is an IIFE that adds to `LJ`.
- `index.html` is the authoritative script load order. Later IIFEs depend on earlier ones; include any new script there and in the offline shell. `game.js` owns simulation, `discoveries.js` adds finds, and `site.js` handles sharing/installing independently of the game.
- Game art is generated in `js/sprites.js`, `js/art.js` and `js/sprites2.js`; game rendering loads no image files.
- Rules live in tables in `game.js`: `SHOP`, `TIERS` (base upgrades), `BLD` (buildings), `VEH` (vehicles) and `FOE` (enemies). Prefer adding a field to a table over special-casing a kind in code.
- The map is 104×72 tiles of 16 px. World layers are typed arrays on `G.world`.
- Sound effects are data in `js/sfx-defs.js` (stacks of tone/noise layers) played by `js/sound.js`. Add a sound by adding an entry there and calling `LJ.sfx('name')`.
- Music is data too: scores in `js/songs.js` (`LJ.SONGS`, a text notation explained at the top of the file) played by the sequencer and synthesized instruments in `js/music.js`. `main.js` picks the song for the moment (`title`, `road`, `work`, `deep`, `raid`, `ending`). `tests/music.test.cjs` checks that every score parses and its tracks line up.
- Everything a character says lives in `js/lines.js` (`LJ.LINES`, plus `LJ.CUES` for wordless sounds like war cries). `say()` shows the text and `voice.js` plays the recording from `audio/voice/` when one exists, keyed by the line's text, so rewording a line means re-recording it. Record them in `voices.html` (`js/voices-studio.js`). A new line goes in `lines.js` and is picked up by the booth automatically.
- Saves (`save.js`) store only what changes during play and regenerate the map from its seed. Bump `VERSION` there if the saved shape changes. Verify current round-trips and older save shapes, including a mostly cleared map: new state must initialise without changing existing terrain, progress or destroyed objects.
- For shipped HTML/CSS/JS changes, follow the PWA release notes in `README.md`: keep `sw.js`'s `CORE` list complete and bump `CACHE`. `tests/pwa.test.cjs` checks shell coverage; verify offline boot and save restoration after loading/caching changes.

## Parallel work and integration

When using worktrees/subagents:
- Pin the base commit and assign file boundaries, entry numbers and an integration owner before work starts. Give shared files (`docs/REQUIREMENTS.md`, `index.html`, `sw.js`, common UI/game tables) one owner; other agents provide their required edits and decisions in the handoff. The log owner appends entries and index rows in request order as part of integration.
- Workers commit in their own worktrees and report the commit, exact checks/results and remaining limitations. The integration owner reviews each change and serialises merges into main. Recheck main's HEAD/status before merging: other chats may have advanced it. Preserve their work and review overlapping conflict resolutions.
- Review against the pinned base, then check the combined result. After fixes, review the changed area and affected checks rather than restarting an unchanged review.

## Conventions

- Keep the ending a surprise: nothing in the UI before the ending should hint at the data center. The opening story says an AI took the player's job; it must not say what the land is for.
- The game is set in Finland: spruce, Scots pine and birch; reindeer, swans, wolves and bears; red wooden houses with white trim; prices in euros.
- Match the existing pixel-art style: light from the top-left, dark outlines, small palettes.
- Animal audio uses playful, stylized game effects or voiced creature performances. Record downloaded sound sources, licenses and processing details in `credits.html`.

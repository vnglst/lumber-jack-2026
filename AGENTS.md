# Notes for coding agents

Lumberjack is a browser game in plain JavaScript: no build step, no dependencies, no modules. The design brief is `docs/GAME-PLAN.md`; `docs/REQUIREMENTS.md` is the decision log of every later request, in order, and where it differs from the game plan, the later entry wins. Read both before changing gameplay; reuse that context during the task, reading only new or relevant entries again. Keep the decision log up to date as you work: whenever the user asks for a feature or a change, or makes a design decision, add an entry at the end of `REQUIREMENTS.md` as part of the same change, with the user's words quoted, the requirements as bullets and any *Decision:* notes, and add a row to its index table. Never rewrite an old entry; only give it a **Status** line saying which entry superseded it. Leave out requests that only ask to commit or merge.

## Running and checking

- `make` serves the game at http://localhost:5173 with caching disabled (`tools/serve.py`).
- `make check` syntax-checks the scripts; `make test` also runs the dependency-free regression suite (`node --test tests/`). `tests/harness.cjs` steps the real simulation with rendering and sound stubbed. Browser checks cover what those stubs cannot: layout, input, rendering and actual audio.
- `make playtest SEEDS="1 2 3"` runs deterministic scripted campaigns (`tests/campaign.cjs`). Run it after rule changes; compare reports before and after behavior-preserving refactors.
- A regression test must fail on the code before the fix. To check, unpack the base beside a copy of the tests and run the one file there: `git archive <base> js | tar -x -C <tmp>`, `cp -r tests <tmp>/`, `node --test <tmp>/tests/<file>`.
- `tests/camera.test.cjs` loads `ui.js` alone and `tests/render-fog.test.cjs` loads `render.js`, each against a small hand-written `LJ`. When `ui.init` or `render` starts reading another `LJ` member, extend those stubs.
- When a scripted campaign stalls or loses, find out whether the scripted player or the game is at fault before changing rules. `campaign(seed, hours, { onStall })` hands over the live game at each stall: print what every unit is doing and why it cannot continue. Fix the player when a person would simply have done something else.
- Campaign reports are only comparable while the order of `Math.random()` draws is unchanged. In a refactor, do not merge, split or reorder update loops.
- For a bug, capture a focused failing check before editing. Run affected checks while iterating, then syntax and the full suite once on the final merged code; repeat only after changes or failures. Keep test output to the summary and relevant failures.
- Browser checks: serve a worktree with `python3 tools/serve.py <port>`. Give concurrent servers distinct ports and coordinate browser ownership. Use an isolated test context if a shared profile is busy. For live edits, bypass/unregister the service worker; test installed/offline behaviour separately with its cache enabled.
- Scripted browser checks: fast-forward with `LJ.update(0.05)` in a loop instead of waiting. Maps are random per new game, so take click targets from `LJ.G`; a click under a tree canopy is a chop order, not a move. For sound, launch Chromium with `--autoplay-policy=no-user-gesture-required` and measure levels on an `AnalyserNode`.
- Say plainly what a check could not judge: nobody listened to the music, a scripted player cannot tell whether the game is fun.
- For HUD/navigation changes, check a full late-game HUD, an active market offer and the shop at narrow portrait and landscape sizes, as well as the opening screen.

## Tools

- Keep shell commands short and single-purpose so they can match the user's allow rules: prefer `make` targets and the file-edit tools over long compound commands, heredocs and inline scripts. Put a longer script in a file and run it.
- Git may be configured with an external diff tool here. For a diff you read or pipe, use `git --no-pager diff --no-ext-diff`.
- The shell is zsh: an unquoted `$VAR` holding several words is passed as one argument.

## Code

- Everything hangs off the global `LJ`; the game state is `LJ.G`. Each file is an IIFE that adds to `LJ`.
- `index.html` is the authoritative script load order. Later IIFEs depend on earlier ones; include any new script there, in the offline shell (`sw.js` `CORE`) and, if the simulation needs it, in the load list in `tests/harness.cjs`. `game.js` owns simulation, `critters.js` the peaceful wildlife (no effect on the rules), `discoveries.js` adds finds, `ore.js` seeds the ore veins (`G.veins`, ore left per tile), and `site.js` handles sharing/installing independently of the game.
- Game art is generated in `js/sprites.js`, `js/art.js` and `js/sprites2.js`; game rendering loads no image files.
- Rules live in tables in `game.js`: `SHOP`, `TIERS` (base upgrades), `BLD` (buildings), `VEH` (vehicles) and `FOE` (enemies). Prefer adding a field to a table over special-casing a kind in code.
- A unit's order is its `task` (`work`, `haul`, `saw`, `mine`, `hunt`, `move`, `retreat`, `doze`, `shuttle`). A new task type needs a branch in `think()`, a state in `updUnit()`, a label in `LJ.statusOf()`, a case in `taskOut`/`taskIn` in `save.js`, and a decision on how `hurtUnit()` and `defend()` interrupt it. `u.hold` means the player said stop: automation leaves the unit alone.
- Predators are rows in `FOE` (wolf, lynx, wolverine, bear): odds by level, group size, strength relative to a wolf, arrival cue and warning. A new one also needs a sprite in `js/sprites2.js` (two walking frames, same-width rows), bitten lines and cues in `js/lines.js`, and a scene in the playground.
- Resources are wood, lumber, stone and ore. Each has a price in `PRICE`; `RESERVE` is what camp keeps back from the market; shop costs are `{ m, w, l, o }` (money, wood, lumber, ore); a hauler's `load` is `{ w, l, s, o }`. A new resource touches `loadUp()`, `sell()`, the cost helpers, `crewLost()`, the HUD chip and the save fields. Ore veins and forest finds are seeded from the map seed in their own random streams: never draw from the world generator's stream for a new feature, or existing maps change.
- Keep these invariants, tested in `tests/playtest-fixes.test.cjs`: a building may not cut walkable ground off from the road; a unit the game moves lands on ground the road reaches; an order that cannot be carried out ends with a spoken reason instead of waiting; the game is lost only when no jack can be hired.
- The map is 104×72 tiles of 16 px. World layers are typed arrays on `G.world`, indexed by tile. Use `colOf(i)` / `rowOf(i)` (also on `LJ`) for columns and rows; in `game.js`, `midX(i)` / `feetY(i)` give the unit standing position.
- Sound effects are data in `js/sfx-defs.js` (stacks of tone/noise layers) played by `js/sound.js`. Add a sound by adding an entry there and calling `LJ.sfx('name')`.
- Music is data too: scores in `js/songs.js` (`LJ.SONGS`, a text notation explained at the top of the file) played by the sequencer and synthesized instruments in `js/music.js`. `main.js` picks the song for the moment (`title`, `road`, `work`, `deep`, `raid`, `ending`). `tests/music.test.cjs` checks that every score parses and its tracks line up.
- Everything a character says lives in `js/lines.js` (`LJ.LINES`, plus `LJ.CUES` for wordless sounds like war cries). `say()` shows the text and `voice.js` plays the recording from `audio/voice/` when one exists, keyed by the line's text, so rewording a line means re-recording it. Record them in `voices.html` (`js/voices-studio.js`). A new line goes in `lines.js`; a line under `misc` must also be added to one of the booth groups at the bottom of that file, or it will never be offered for recording.
- Interface: colours are CSS custom properties at the top of `css/style.css` (the painted-board look, §48); use them instead of new hex values. Menus are screens in `js/menus.js` (`SCREENS`): add one there and reach it with a `data-go` row; Back, Close, Escape, the pause state and focus are handled by the stack. One-message dialogs go through `dialog()` / `modal()` in `ui.js`, where each button names its action in `data-a` and `data-esc` marks the one Escape presses. Buttons carry pixel icons, not glyphs or SVG: draw a 12 by 12 grid with `pix()` in `js/art.js` and place it with `<i data-ic="…">` (then `ui.icons(root)` for markup added later). Check new interface at phone width: dialogs are bottom sheets there and tap targets are at least 44 px. Escape backs out one layer at a time (§49). A new key or button also goes in the controls table in `ui.showHelp()` and in the button's tooltip.
- Saves (`save.js`) store only what changes during play and regenerate the map from its seed. Bump `VERSION` there if the saved shape changes. Verify current round-trips and older save shapes, including a mostly cleared map: new state must initialise without changing existing terrain, progress or destroyed objects.
- For shipped HTML/CSS/JS changes, follow the PWA release notes in `README.md`: keep `sw.js`'s `CORE` list complete and bump `CACHE`. `tests/pwa.test.cjs` checks shell coverage; verify offline boot and save restoration after loading/caching changes.

## Parallel work and integration

Other chats work in this repository at the same time and merge into the same `main` checkout, without coordinating with you:
- Create your worktree first and read the files there. The main checkout may be newer than what you read a minute ago.
- Before merging or pushing, look at the main checkout: `git status` and whether `.git/MERGE_HEAD` exists. If a merge is in progress or there are changes you did not make, wait until it is finished. Never commit, stash or reset over it.
- Choose the `REQUIREMENTS.md` entry number and the `sw.js` `CACHE` version when you merge, not when you start: take the next free one. When both sides appended to the log, keep both entries in request order.
- Commit and merge when asked to; push only when asked to. A push sends everything on `main`, other chats' merges included: say so.

When using worktrees/subagents:
- Pin the base commit and assign file boundaries, entry numbers and an integration owner before work starts. Give shared files (`docs/REQUIREMENTS.md`, `index.html`, `sw.js`, common UI/game tables) one owner; other agents provide their required edits and decisions in the handoff. The log owner appends entries and index rows in request order as part of integration.
- Workers commit in their own worktrees and report the commit, exact checks/results and remaining limitations. The integration owner reviews each change and serialises merges into main. Recheck main's HEAD/status before merging: other chats may have advanced it. Preserve their work and review overlapping conflict resolutions.
- Review against the pinned base, then check the combined result. After fixes, review the changed area and affected checks rather than restarting an unchanged review.

## Conventions

- Keep the ending a surprise: nothing in the UI before the ending should hint at the data center. The opening story says an AI took the player's job; it must not say what the land is for.
- The game is set in Finland: spruce, Scots pine and birch; reindeer, swans, wolves and bears; red wooden houses with white trim; prices in euros.
- Match the existing pixel-art style: light from the top-left, dark outlines, small palettes.
- Animal audio uses playful, stylized game effects or voiced creature performances. Record downloaded sound sources, licenses and processing details in `audio/CREDITS.md`; player-facing attribution belongs in the credits popup.

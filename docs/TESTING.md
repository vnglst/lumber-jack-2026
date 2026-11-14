# Gameplay checks

Run `make check` and `node --test tests/*.test.cjs` for syntax and dependency-free simulation checks.

## Browser smoke checks

Serve with `make`. Use a fresh game, without replacing a wanted save.

- Desktop (1365 × 900): start, watch the truck arrive and tent appear, hire a Jack, select/order units, stop, zoom, pan with the wheel, open/close Shop and Help.
- Mobile portrait (390 × 844): start, hire from Shop, tap/select, drag to pan, use zoom buttons; check the HUD, selected-unit panel and Shop fit.
- Mobile landscape (844 × 390): open Help, scroll its dialog, reach Back to work; repeat with the start screen.
- Camp logistics: jacks bring wood to camp; the truck loads only deposited surplus above 20 wood and sells it at the west edge. Stockpiling pauses automatic loading.
- Saving: reload and Continue; units, goods and progress remain available.
- Worker experience: select a Jack, complete work and check XP, promotion feedback and the updated carrying capacity; reload to verify rank persistence.
- Upgraded village: toggle Stockpiling and confirm automatic market loading pauses while forest deliveries continue.
- Construction: place a building and upgrade the village; check scaffolding, yellow progress bars and seconds remaining. Verify benefits start only on completion, Help pauses construction, and reload/Continue resumes the same project.
- Roots: select a bulldozer and order it onto a reachable stump. Check the three-second uprooting action, bare mud, cargo, delivery to camp or a Logging Truck, and persistence after reloading.
- Market deals: listen for the rising chime when a fresh offer appears; verify it does not repeat while the offer remains visible, and that mute silences it.

## Checked 14 Nov 2026

Chromium desktop and mobile-sized viewports. Touch-pointer events were simulated; this is **not** a physical-device or Safari test.

- Arrival, hiring, Shop, zoom and portrait layout passed.
- Found and fixed landscape dialogs overflowing the screen: dialogs now scroll within the viewport.
- Landscape dialog scrolling and button reachability passed after the fix.
- Desktop wheel/keyboard controls, Shop/Help, and reload/Continue passed, with saved money, wood and crew restored.
- Simulation coverage also checks all-unit local attacks, Logging Truck routes and save migration, level-5 hostility, and persistent terrain wear.
- Actual ground-renderer samples progressed from green `(80,151,58)` to brown `(146,103,64)` to dark ruts `(63,50,39)` with increasing wear.
- Opening tutorial: a compact start screen replaces the instructions wall; the truck takes 25 seconds, with five successive captions. Caption layout checked at desktop and mobile sizes; full instructions remain in Help.
- Seeded opening, late-game and experience results are recorded in [PLAYTESTING.md](PLAYTESTING.md), including the limits of automated playtesting.
- Construction: browser-checked a 15-second Cabin upgrade and an unfinished Sawmill. Confirmed the pending tier/services, build-time descriptions, partial sprite/scaffolding rendering, and paused timer. Regression checks include unfinished tower healing/fire, housing limits, destroyed stakes/sites, and saving the first Cabin upgrade.
- Roots: browser-checked a right-click work order, the muddy ground shader and the “Delivering root wood · 2/16” status before wood entered village stock. Regression checks cover one-time yields, shared jobs, full/partial deliveries, Stop, saved orders/cargo/mud, and unchanged rock/water clearing.
- Direct review caught and fixed an overflow after saving a partial Logging Truck handoff: a bulldozer carrying 15 wood now unloads before digging another two.
- Market deal alert: regression-checked new wood/lumber offers, expiry, dismissal, acceptance and save restoration. Rendered the new chime through real Web Audio: about 0.89 seconds of nonzero audio with no clipping; mute and audio-unlock gates are covered by the sound-engine test.
- Combat retreat: simulation regressions reproduce a wolf bite replacing a move order, then verify retreat persists after damage, defense resumes at the destination or on a new attack order, and unreachable moves leave combat unchanged. Laser checks preserve in-flight bolts and other units' bursts while canceling the retreating Jack's queued shots.
- Forest villages: browser-checked right-click and synthetic touch hut attacks, the damaged-hut health bar, “Attacking hut” status and removal on destruction; no console errors. Simulation checks cover early proximity defense, replenishment, machine targets, staying near home, surviving other villages, axes/lasers, no fallback war-party sources, late-forest defense, placement protection, save persistence and the legacy seven-hut layout. Three ten-minute seeded opening simulations reached level 4 without losing their two Jacks.
- Intro route: regression-checked road/bridge-only, four-direction travel and arrival at the camp parking spot on six maps; verified a valid road-only route on 100 seeded maps. Story timing and ordinary hauling regressions still pass.
- Initial fog: browser-confirmed all 7,488 tiles start hidden; after ten seconds, only 298 tiles along the drive were explored and camp was still hidden. Checked the road-following truck and fog visually, skipping without a jump or premature camp reveal, and camp visibility on arrival; no console errors. Regressions cover three maps, retained road exploration, save/load and starting a fresh game.
- Truck direction: measured one-second movement in all eight directions for market and Logging Trucks on road, bridge, dirt, gravel and grass. Existing movement gives equal total distance on each surface, with normalized diagonal components; no movement-code correction was necessary.

Before release, repeat on physical iOS Safari and Android Chrome, including two-finger pinch and orientation changes.

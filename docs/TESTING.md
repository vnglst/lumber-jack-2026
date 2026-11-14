# Gameplay checks

Run `make check` and `node --test tests/*.test.cjs` for syntax and dependency-free simulation checks.

## Browser smoke checks

Serve with `make`. Use a fresh game, without replacing a wanted save.

- Desktop (1365 × 900): start, watch the truck arrive and tent appear, hire a Jack, select/order units, stop, zoom, pan with the wheel, open/close Shop and Help.
- Mobile portrait (390 × 844): start, hire from Shop, tap/select, drag to pan, use zoom buttons; check the HUD, selected-unit panel and Shop fit.
- Mobile landscape (844 × 390): open Help, scroll its dialog, reach Back to work; repeat with the start screen.
- Camp logistics: jacks bring wood to camp; the truck loads only deposited surplus above 20 wood and sells it at the west edge. Stockpiling pauses automatic loading.
- Saving: reload and Continue; units, goods and progress remain available.

## Checked 14 Nov 2026

Chromium desktop and mobile-sized viewports. Touch-pointer events were simulated; this is **not** a physical-device or Safari test.

- Arrival, hiring, Shop, zoom and portrait layout passed.
- Found and fixed landscape dialogs overflowing the screen: dialogs now scroll within the viewport.
- Landscape dialog scrolling and button reachability passed after the fix.
- Desktop wheel/keyboard controls, Shop/Help, and reload/Continue passed, with saved money, wood and crew restored.
- Simulation coverage also checks all-unit local attacks, Logging Truck routes and save migration, level-5 hostility, and persistent terrain wear.
- Actual ground-renderer samples progressed from green `(80,151,58)` to brown `(146,103,64)` to dark ruts `(63,50,39)` with increasing wear.
- Opening tutorial: a compact start screen replaces the instructions wall; the truck takes 25 seconds, with five successive captions. Caption layout checked at desktop and mobile sizes; full instructions remain in Help.

Before release, repeat on physical iOS Safari and Android Chrome, including two-finger pinch and orientation changes.

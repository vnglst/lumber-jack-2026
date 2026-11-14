# Gameplay playtest — 14 Nov 2026

## Scope and limits

- Three seeded, ten-minute **scripted openings** using real starting resources, normal purchases and work orders: `node tests/playtest.cjs`.
- Controlled fixtures for mid/late-game mechanics, including the nine advancement gates and the complete last-tree-to-ending sequence. These do **not** represent organically completing three campaigns.
- Browser verification of the upgraded-village stockpiling switch and its hint.
- Simulation runs use normal 0.05-second steps, not a player-facing speed-up feature.
- This catches measurable friction and regressions. Whether the whole campaign feels fun still needs human playtesting, especially long-session balance and physical mobile controls.

## Opening baseline

Times exclude the 25-second narrated arrival.

| Seed | First sale | Level 2 | Cabin | Level after 10 min | Trees cut | Jacks alive |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 38 s | 64 s | 76 s | 3 | 236 | 2 |
| 42 | 42 s | 60 s | 91 s | 4 | 306 | 2 |
| 12345 | 40 s | 58 s | 86 s | 4 | 249 | 2 |

The scripted player hires once, buys early upgrades when affordable, and reassigns idle workers to explored trees. It does not build a complete expansion economy. These results support retaining the opening economy, not blindly increasing all production.

## Demonstrated problems and corrections

1. **Destroyed sawmills still worked.** A worker produced lumber within four seconds of the last mill being destroyed. Workers now verify a live mill, move to another if available, or stop sawing.
2. **Resource planning lost its control.** The stockpiling switch disappeared after the Cabin upgrade, even though later upgrades need up to 80 lumber and haulers normally keep only 30. The switch now remains available, with a clear hint. It pauses automatic market loading, not forest deliveries.
3. **Identical repeat attacks.** At level 6, all three seeds produced sizes `9, 10, 11, 11`, with exactly 116 seconds between waves. Repeat size and rest now vary within bounds; the initial 50-second warning is unchanged and recovery never falls below 60 seconds.
4. **Premature ceasefire and phantom countdown.** At fewer than 2% of trees remaining, new waves silently stopped while the countdown stayed at zero. Remaining forest can now support small parties of at most six; existing parties still retreat from losses or timeout. With fewer than four trees, the countdown is removed. Spawn safety distances and habitat checks remain in place.

## Endgame checks

- Advancement requires both the tree milestone and revenue quota.
- One remaining tree does not trigger the ending.
- A real chop order for the last tree triggers the visitor, dialogue, construction and whole-map spread.
- The bonus is awarded once, and the ending reaches its final screen.
- No early UI or tutorial text was changed to reveal the surprise.

## Repeatable regression checks

`node --test tests/*.test.cjs` covers these fixes alongside transport, combat, saving, terrain and the intro. Repeat the browser checklist in [TESTING.md](TESTING.md) after UI changes.

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
- A controlled browser fixture also reached the real “Game over.” screen, with the full spread complete and no trigger before the last tree.
- No early UI or tutorial text was changed to reveal the surprise.

## Repeatable regression checks

`node --test tests/*.test.cjs` covers these fixes alongside transport, combat, saving, terrain and the intro. Repeat the browser checklist in [TESTING.md](TESTING.md) after UI changes.

## Experience tuning

The first XP prototype capped both workers at Master (480 XP) within ten minutes on every seed. That left no further worker progression for the middle of the game. Revised ranks use Expert at 480 and Master at 1,200, without raising the final power cap.

Repeating the same scripted opening with the revised XP system:

| Seed | Trees before XP | Trees with XP | Crew XP after 10 min | Ranks | Level |
| --- | --- | --- | --- | --- | --- |
| 1 | 236 | 287 | 778 / 758 | Expert / Expert | 4 |
| 42 | 306 | 392 | 981 / 962 | Expert / Expert | 4 |
| 12345 | 249 | 311 | 865 / 789 | Expert / Expert | 4 |

First sales remain at 38–42 seconds. Equipment purchases can occur in a different order as income and level timing change. The roughly 22–28% increase in trees cut is a combined outcome of experience and the scripted player's purchase timing, not an isolated laboratory speed multiplier.

Checks cover real tree work, processing, storage and market deliveries, capped benefits, fresh recruits, nonproductive actions earning no XP, machines not earning XP, and version-2/3/4 save compatibility. Browser checks confirm the promotion float and rank/XP panel; a 390-pixel-wide layout also accommodates the longer Expert progress label.

# Requirements and decision log

A decision log of the game's requirements: every request made while the game was built, in the order it was made, with the decisions taken to carry it out. The starting point is the design brief, [GAME-PLAN.md](GAME-PLAN.md) (v0.9), with the concept image [concept-art.png](concept-art.png).

How to read it:
- **Entries are never rewritten.** A change of mind is a new entry. It names the entries it **Supersedes**, and each older entry gets a **Status** line pointing forward to the entry that replaced it.
- **Where entries conflict, the later one wins**, including over the game plan.
- ***Decision:*** notes record choices made while carrying out a request.
- Requests that only asked to commit or merge changes are left out.

| # | Date | Entry | Status |
| --- | --- | --- | --- |
| 0 | 13 Nov | Game plan and concept art | Partly superseded by 7 |
| 1 | 13 Nov | MVP | Done |
| 2 | 13 Nov | Level 2 and gameplay | Active |
| 3 | 13 Nov | Ending sprites | Active |
| 4 | 13 Nov | Wild animals and guns | Active |
| 5 | 13 Nov | All levels | Done |
| 6 | 13 Nov | Visual quality | Active |
| 7 | 13 Nov | Trucks, fog of war, ending, village, buildings and logging | Active |
| 8 | 13 Nov | Scrolling the map | Active |
| 9 | 13 Nov | Forest inhabitants, defences and lasers | Active |
| 10 | 14 Nov | The road to the market | Active |
| 11 | 14 Nov | Saving, bulldozers and Mac controls | Active |
| 12 | 14 Nov | Sound effects studio | Superseded by 15, 16 |
| 13 | 14 Nov | Running and repository | Active |
| 14 | 14 Nov | Saving and reverting sounds | Superseded by 16 |
| 15 | 14 Nov | Voice recording studio | Active |
| 16 | 14 Nov | Remove the sound effects studio | Done |
| 17 | 14 Nov | Requirements and decision log | Active |
| 18 | 14 Nov | Faster start with an extra Jack | Active |
| 19 | 14 Nov | Arrive by truck and store wood at camp | Active |
| 20 | 14 Nov | Mobile and desktop testing | Active |
| 21 | 14 Nov | Locals attack every unit type | Active |
| 22 | 14 Nov | Logging trucks replace log depots | Active |
| 23 | 14 Nov | Peaceful locals before later attacks | Active |
| 24 | 14 Nov | Heavy vehicles scar the terrain | Active |
| 25 | 14 Nov | Slow narrated arrival tutorial | Active |
| 26 | 14 Nov | Quieter recorded voices | Active |
| 27 | 14 Nov | Playtest and improve the full gameplay loop | Active |
| 28 | 14 Nov | Jacks learn through work | Active |
| 29 | 14 Nov | Construction takes time | Active |
| 30 | 14 Nov | Bulldozers uproot stumps for more wood | Active |
| 31 | 14 Nov | Opening story, opening screen and Finland | Active |
| 32 | 14 Nov | More natural truck wobble | Active |
| 33 | 14 Nov | Smoother, faster opening drive | Active |
| 34 | 14 Nov | Ground the cottage on the opening screen | Active |
| 35 | 14 Nov | Tapping through the story does not move the truck | Active |
| 36 | 14 Nov | Normal fog reveal during the opening drive | Active |
| 37 | 14 Nov | Slower working trucks | Active |
| 38 | 14 Nov | Audible market deal notifications | Active |
| 39 | 14 Nov | Move orders let Jacks retreat from combat | Active |
| 40 | 14 Nov | Huts are persistent sources of village defenders | Active |
| 41 | 14 Nov | Intro truck follows the road | Active |
| 42 | 14 Nov | Start fully hidden and explore during the intro | Active |
| 43 | 14 Nov | Truck speed is independent of direction | Active |
| 44 | 14 Nov | Useful and distinct forest collection trucks | Active |
| 45 | 14 Nov | Felling tractors and forest discoveries | Active |
| 46 | 14 Nov | Sharing, installation and analytics | Active |
| 47 | 14 Nov | Map-edge navigation and black padding | Active |
| 48 | 14 Nov | An interface of its own: painted boards, not Stardew wood | Active |
| 49 | 14 Nov | Predictable navigation and controls | Active |
| 50 | 14 Nov | Music for the opening, play and other scenes | Active |
| 51 | 15 Nov | Full-campaign playtest: dead ends removed, losses made recoverable | Refined by 86 |
| 52 | 15 Nov | Codebase review and refactor | Active |
| 53 | 15 Nov | Sourced animal sound effects | Active |
| 54 | 15 Nov | More efficient agent instructions | Active |
| 55 | 15 Nov | Playful animal voices | Active |
| 56 | 15 Nov | Review before pushing: displaced units stay on connected ground | Active |
| 57 | 15 Nov | Welcome screen covers the first paint | Active |
| 58 | 15 Nov | Subtle interface animations | Active |
| 59 | 15 Nov | Creator and source-code credits | Active |
| 60 | 15 Nov | Agent notes from the interface, playtest and refactor sessions | Active |
| 61 | 15 Nov | Palisades block every unit | Active |
| 62 | 15 Nov | Credits open inside the welcome screen | Refined by 63 |
| 63 | 15 Nov | Credits also open from settings | Active |
| 64 | 15 Nov | Separate music and effects volumes | Refined by 70 |
| 65 | 15 Nov | Game sequence testing playground | Active |
| 66 | 15 Nov | Wildlife originals in the recording booth | Active |
| 67 | 15 Nov | Compact mobile Jack actions | Active |
| 68 | 15 Nov | Play testing and voice recording credits | Active |
| 69 | 15 Nov | A clearer mobile game interface | Active |
| 70 | 15 Nov | Dedicated sound settings menu | Active |
| 71 | 15 Nov | Ore: mining, and ore in the shop and the market | Refined by 86 |
| 72 | 15 Nov | Northern lights mirrored in the lake; playtest with ore | Active |
| 73 | 15 Nov | Review before merging: a palisade may not seal the camp | Active |
| 74 | 15 Nov | Menus as one stack of screens; pixel-art icon buttons | Active |
| 75 | 15 Nov | Fade in the initial welcome screen | Active |
| 76 | 15 Nov | Review the startup fade before pushing | Done |
| 77 | 15 Nov | Separate development from the production package | Active |
| 78 | 15 Nov | Publishing safeguards and licensing | Active |
| 79 | 15 Nov | Document the Coolify static release flow | Active |
| 80 | 15 Nov | Switch hosting to the static package | Active |
| 81 | 15 Nov | Lynx and wolverine join the wildlife | Active |
| 82 | 15 Nov | Playful motion in menus and the interface | Active |
| 83 | 15 Nov | Playground source stays current | Active |
| 84 | 15 Nov | Every playground scene in the test suite | Active |
| 85 | 16 Nov | Playable developed towns in the playground | Active |
| 86 | 16 Nov | Playtest to the end: towers that matter, automation that is earned, a livelier finish | Active |

---

## 0. Game plan and concept art (13 Nov 2026)

> Build the game as described in the GAME-PLAN.md file. The image "Pixel Lumberjack Strategy Base.png" gives an impression of how it could look.

- Implement [GAME-PLAN.md](GAME-PLAN.md). The full brief is there; its core points:
  - a 2D pixel-art, top-down browser RTS about logging
  - 10 levels in one continuous forest
  - automation in the spirit of Factorio
  - humorous jacks that get annoyed when clicked repeatedly
  - the surprise AI data center ending: "Game over." followed by "Do you want to clear another piece of land?"
  - runs in the browser and on mobile
- Use [concept-art.png](concept-art.png) (originally `Pixel Lumberjack Strategy Base.png`) as the visual reference.

**Status:** partly superseded by §7. The area-clearing orders in game plan §3 were dropped, and the ending now needs every tree gone, not virtually every tree.

## 1. MVP (13 Nov 2026)

> Start with a working MVP version of the first level.

- First deliverable: a playable level 1.

## 2. Level 2 and gameplay (13 Nov 2026)

> Start on level 2, but also improve the gameplay. Village should have a function. Make it more fun, engaging and difficult. Speeding up should not be possible and not be needed to make it engaging.

- Add level 2.
- The village must have a real function in the game.
- Make the game more fun, engaging and difficult.
- **No speed-up control.** The game must be engaging at normal speed.

## 3. Ending sprites (13 Nov 2026)

> Already design other parts of the sprites as well, like the business man at the end. Construction of the AI data center etc.

- Design the ending art now: the businessman in a suit, and the construction of the AI data center.

## 4. Wild animals and guns (13 Nov 2026)

> Also add wild animals that can hunt or kill your jacks. Giving them guns can help. In later levels, animals become more ferocious.

- Wild animals hunt and can kill jacks.
- Guns help jacks defend themselves.
- Animals become more ferocious in later levels.

## 5. All levels (13 Nov 2026)

> Continue

- Complete the remaining levels, through level 10 and the ending.

## 6. Visual quality (13 Nov 2026)

> Improve the game's visual quality and add more environmental detail, bringing it closer to the original concept image. First create and present a small selection of representative sprites for review. Only proceed with the complete set after that review.

- Raise the visual quality and add environmental detail, closer to the concept image.
- Process: show a small set of representative sprites for review first. Do the full set only after approval.

> Yes, do full set

- Approved: redo the full sprite set in the reviewed style.

## 7. Trucks, fog of war, ending, village, buildings and logging (13 Nov 2026)

**Status:** the depot implementation of extra forest drop-off points is superseded by §22; the other requirements remain active.

> - Trucks must be able to stop when commanded.
> - Implement fog of war. Parts of the map remain hidden until the player discovers them.
> - The AI data center must eventually cover the entire map. This should be an animation at the end of the game.
> - The data center should appear only after every single tree has been removed.
> - The initial tent should become the village. Players should be able to upgrade it progressively.
> - Allow players to construct multiple buildings so that the settlement gradually develops into a real village.
>
> Players should not need to designate areas for logging. You can direct them to walk somewhere, either by selecting one of many jacks. Jacks automatically find the nearest available tree and begin cutting, but only within a limited distance. If they don't see any tree nearby, they just stand there.

- **Trucks** stop when commanded.
- **Fog of war**: the map stays hidden until it is discovered.
- **Ending**:
  - The AI data center grows until it covers the entire map, as an end-of-game animation.
  - The data center appears only once **every** tree has been removed, not "virtually every" tree.
- **Village**: the starting tent is the village and can be upgraded step by step.
- **Buildings**: players can place multiple buildings, so the settlement grows into a real village.
- **Logging without area orders**:
  - The player selects one or more jacks and sends them somewhere.
  - Jacks find the nearest tree and start cutting, but only within a limited distance.
  - If a jack sees no tree nearby, it stands still.
- **Supersedes** game plan §3 (area-clearing orders).

## 8. Scrolling the map (13 Nov 2026)

> How am I supposed to scroll the map? When my Jack walks out of the screen.

- The player must be able to scroll the map and keep track of jacks that walk off-screen.

## 9. Forest inhabitants, defences and lasers (13 Nov 2026)

> - The forest is inhabited by local residents who eventually resist the logging operation.
> - These inhabitants are small, cute, bear-like creatures armed with bows and arrows, resembling the Ewoks from Star Wars.
> - They attack in waves.
> - Players need to build defenses, including guard towers and walls, to protect their operations.
> - Improve the mechanics and visual effects of shooting wild animals. Use weapons that behave and look like laser pistols, with bursts of laser.

- **Forest inhabitants**:
  - They live in the forest and eventually resist the logging.
  - They are small, cute, bear-like creatures with bows and arrows.
  - They attack in waves.
  - *Decision: they are original creatures, the Bramblekin, so as not to copy a Star Wars design.*
- **Defences**: guard towers and walls to protect the operation.
- **Weapons**: better shooting mechanics and effects. The guns are laser pistols that fire bursts.

## 10. The road to the market (14 Nov 2026)

**Status:** the pre-explored road is superseded by §42; road layout and transport remain active.

> Hauling to market doesn't make much sense right now. It's right next to the town/start point. Ideas to improve this?

> Ok, my suggestion. You start in the center of the map, but there is already a road to the market available (like it is now). That road is already explored. Walking it takes a long time (take that into account in game mechanics at start) but it speeds up as soon as you have (multiple) trucks.

- Start in the **center** of the map.
- An existing road leads to the market at the map edge, and it is already explored.
- Walking the road takes a long time, and the early-game economy must allow for that.
- Trucks make it much faster, and more trucks speed it up further.
- **Supersedes** the earlier layout, where the market sat next to the start. That layout was an implementation choice and never had an entry of its own.

## 11. Saving, bulldozers and Mac controls (14 Nov 2026)

> - Game state should be stored in local storage.
> - The bulldozers should keep bulldozing area nearby, like the jacks
> - Scroll across the map on Macbook should work with two fingers (zooming is done via buttons). Make mac scrolling and usage easier.

- **Saving**: the game state is stored in localStorage.
- **Bulldozers** keep clearing obstacles nearby on their own, the way jacks keep chopping.
- **Mac trackpad**:
  - Two-finger scrolling pans the map.
  - Zoom is done with buttons.
  - Scrolling and general use on a Mac must be easy.

## 12. Sound effects studio (14 Nov 2026)

*Requested in a separate session, which ran alongside the main one. Entries 12, 14, 15 and 16 come from that session.*

> I want to create playful and entertaining sound effects for the game. Provide a convenient UI for creating and managing these sounds.

- Playful, entertaining sound effects.
- A convenient UI for creating and managing them.

**Status:** superseded by §15 (voices instead of sound effects) and §16 (studio removed).

## 13. Running and repository (14 Nov 2026)

> How do I start the game, create a `make` command for that. Organize the repo, add some documentation like README.md and file for agents. Keep these minimal.

- `make` starts the game.
- Organise the repository.
- Add a minimal [README.md](../README.md) and a minimal file for coding agents, [AGENTS.md](../AGENTS.md).

## 14. Saving and reverting sounds (14 Nov 2026)

> that testing is useful! But there should be a way to save them, clear distinction so I can revert sounds if not happy.

- Keep the in-game testing of sounds.
- Sounds can be saved.
- Saved sounds are clearly separate from drafts.
- Any sound can be reverted.

**Status:** superseded by §16 (studio removed).

## 15. Voice recording studio (14 Nov 2026)

> These are not the sounds I was thinking of. I was thinking of the things the Jacks say, on repeated clicks. And also sounds of the locals etc etc. All things that are now text based. Gather these. Simplify the UI for that purpose. It's a recording studio.

- The studio is for **voices**, not synthesized effects.
- Gather everything that is currently text only, such as what jacks say when clicked repeatedly and the sounds the forest folk make.
- A simple UI built for recording them: a recording studio.
- *Decision:*
  - *All spoken lines live in `js/lines.js`.*
  - *Recordings are made in `voices.html`.*
  - *In the game, a line plays its recording from `audio/voice/` when one exists, and is otherwise shown as text only.*

## 16. Remove the sound effects studio (14 Nov 2026)

> on the main worktree, remove the previously made studio for editing sounds, I don't need that. I only want to record voices.

- Remove the sound effects studio. Only the voice recording studio stays.
- **Supersedes** §12 and §14.

## 17. Requirements and decision log (14 Nov 2026)

> Gather all requirements and specifications that I've given here and store those in requirements documentation. Move that to docs folder. Also include the original gameplan there (move that). Keep the chronology.

> Reference this in the agent + readme files, so agents and humans know about this

> Don't forget to also get those specs from the other session, about the voice recording studio.

> yes it should be like a decision log

- This document, kept in `docs/` next to the game plan.
- Include the requests from the sound and voice session.
- README.md and AGENTS.md point to this document.
- Keep it as a decision log: new entries are added at the end, and older entries change only to get a **Status** line.

## 18. Faster start with an extra Jack (14 Nov 2026)

> You should start with enough money to hire an extra Jack, who will come walking towards your village right away. Otherwise the game starts really slowly.

- New games start with enough money to hire a second Jack immediately.
- Hiring is available at the starting tent in level 1, without a Cabin upgrade.
- The hired Jack immediately walks from the market along the road towards the settlement.
- *Decision: start with $80 (the first hire's price), give the tent room for two jacks, and show a hiring hint. Cabin and later hires retain village training. Existing saves keep their money and progress.*

## 19. Arrive by truck and store wood at camp (14 Nov 2026)

**Status:** the arrival's pacing and presentation are refined by §25; camp logistics remain active.

> When starting the game, you arrive in a truck that drives you to the forest, where you then set up your tent. Wood should be carried to the tent/village before it can be picked up by the truck.

- A new game opens with a truck driving from the market to the forest, followed by Jack getting out and pitching the tent.
- Harvested wood must be deposited at the tent/village before market transport.
- *Decision: the arrival truck stays as the first market truck, with no upkeep. It automatically sells surplus, retaining the existing 20-wood building reserve. Stockpiling pauses automatic loading. Later purchased trucks retain their existing orders and upkeep.*
- *Decision: the short arrival sequence is replayed rather than saved midway; normal saves resume once camp is ready. Existing saves remain compatible.*
- **Supersedes** the pre-village direct-to-market carrying in game plan §5.

## 20. Mobile and desktop testing (14 Nov 2026)

> Test the game on both mobile and desktop

- Check starting, hiring, controls and layout at desktop and mobile sizes.
- Include portrait and landscape mobile layouts.
- *Decision: use Chromium with desktop and mobile-sized viewports and synthetic touch-pointer input. Physical iOS/Android devices are not available in this environment; those remain a release check.*
- Fix short-screen dialogs so their buttons remain reachable by scrolling.

## 21. Locals attack every unit type (14 Nov 2026)

> Locals should attack any kind of unit, also trucks and bulldozer.

- Forest folk target jacks, trucks, bulldozers and harvesters.
- Arrows damage vehicles; destroyed vehicles and their cargo are lost.
- Show damaged vehicle health in the world and selection panel.
- *Decision: trucks have 180 HP, bulldozers 260 HP and harvesters 240 HP. Nearby jacks defend vehicles too. Wildlife still hunts people, not vehicles.*

## 22. Logging trucks replace log depots (14 Nov 2026)

**Status:** §44 refines partial-load waiting and collection reach; the forest-to-village route remains active.

> Replace the log depot with trucks that travel back and forth between the forest and the village, transporting harvested wood.

- Remove Log Depot purchases; offer Logging Trucks instead.
- Select a Logging Truck and tap a clearing to establish its forest-to-village route.
- Nearby jacks deliver wood to a waiting truck; wood becomes village stock only after the truck returns and unloads.
- Trucks return to the collection point automatically. A full load departs immediately; a partial load waits up to eight seconds.
- Stopped, moving, destroyed or full trucks cannot receive wood. Jacks fall back to village storage.
- *Decision: Logging Trucks unlock at level 3, cost $150 initially, carry 40 wood, and cost $8 per payday. Market trucks retain their separate village-to-market job.*
- *Decision: save format 3 stores logging routes; format 2 remains loadable and existing depots become Logging Trucks at their former locations.*
- **Supersedes** the fixed log depot implementation, and qualifies §19: forest Logging Trucks may collect harvested wood, but market trucks still load only at the tent/village.

## 23. Peaceful locals before later attacks (14 Nov 2026)

**Status:** early village defense is superseded by §40; level-5 raiding parties remain active.

> Local attacks should only start happening later in the game. First it's just wolves. But you do see them in the woods.

- Early threats are wolves, not local war parties.
- Locals can be seen living peacefully around their forest huts before they become hostile.
- *Decision: local hostility starts at level 5, with a warning and 50-second preparation period before the first wave. Bears remain a level-4 wildlife threat.*
- *Decision: loading an older save below level 5 resets premature local hostility and restores peaceful inhabitants where their habitat remains.*
- Level-up messaging must not announce local hostility earlier than level 5.

## 24. Heavy vehicles scar the terrain (14 Nov 2026)

> Driving trucks and bulldozers should damage the terrain, gradually turning the ground brown, black, and dirty.

- Vehicle movement permanently wears the ground it crosses, removes ground plants and reduces lushness.
- Repeated traffic progresses from brown soil to dark, dirty ruts; the minimap also reflects this.
- Stationary vehicles cause no additional wear.
- *Decision: market and Logging Trucks add 6 wear per tile crossing, bulldozers 10, and harvesters 8. Wear saturates at 255, never wrapping back to clean ground.*
- *Decision: road tiles retain their road behavior while becoming dirty. Wooden bridges, water and rock are not painted as soil. Foot traffic still makes ordinary brown trails rather than black vehicle scars.*
- Existing saved wear and lushness fields persist the damage; the save format does not change.

## 25. Slow narrated arrival tutorial (14 Nov 2026)

> Arrival at camp with truck should be a bit slower. This should be intro/tutorial. So tell the story while driving. No large wall of text when starting game.

> Truck goes too fast.

- Slow the opening truck ride substantially and tell the story while driving.
- Explain camp, wood transport, hiring and basic commands in short successive captions.
- Replace the startup instructions wall with a compact title and Start/Continue controls. Full instructions remain in Help.
- Keep the mute control accessible during the narrated drive.
- *Decision: the ride lasts about 25 seconds across different map seeds, giving five short lines five seconds each. Normal truck hauling speed is unchanged, and gameplay timers wait until camp is ready.*
- *Decision: tutorial speech lives in `js/lines.js`, appears in the recording booth, and plays its recording when available.*
- **Refines** §19's arrival presentation.

## 26. Quieter recorded voices (14 Nov 2026)

> voice sounds should be a bit lower in volume

- Lower in-game recorded voice volume without modifying recordings or sound-effect volume.
- *Decision: play recorded lines and wordless voice cues at 75% gain. Recording-booth previews stay unchanged.*

## 27. Playtest and improve the full gameplay loop (14 Nov 2026)

**Status:** §40 adds persistent hut defenders, independent of raiding-party retreat and last-tree limits. §51 repeats the playtest over the whole campaign.

> Test & review game mechanics. Make sure the game is engaging, fun and unpredictable up until the end.
>
> Use the playtesting results to identify and correct gameplay issues.

- Check opening economy, expansion, combat, resource planning and the last-tree/ending transition.
- Record measured results, distinguish ordinary play from controlled late-game fixtures, and fix demonstrated problems.
- *Decision: retain the measured opening pace rather than speed everything up. Keep the stockpiling switch available after upgrading the tent, so players can save for lumber-heavy upgrades.*
- *Decision: workers stop using a destroyed sawmill or relocate to a surviving one.*
- *Decision: keep the first local warning at 50 seconds. Later waves vary in size and recovery time, with at least 60 seconds between waves and a visible countdown. Small late-game skirmishes replace the previous blanket ceasefire; no new wave is scheduled with fewer than four trees left.*
- Automated simulation and browser checks can find pacing and correctness problems, but do not substitute for human judgments about fun.

## 28. Jacks learn through work (14 Nov 2026)

> Jacks should gain experience through their work and become more effective over time.

- Each Jack earns persistent, individual experience from productive work; new hires start fresh.
- Show the selected Jack's rank and XP, and make promotions visible.
- *Decision: Greenhorn (0 XP), Woodsman (40), Veteran (160), Expert (480), Master (1,200). Playtests found the first 480-XP Master cap was reached within ten minutes, so the final rank now takes longer. Rank bonuses cap at 50% faster chopping/processing, six extra carrying slots and 10% faster walking. Bonuses stack with equipment; machines do not gain experience.*
- *Decision: award 4 XP per felled tree, 2 per lumber processed, 1 per four wood delivered to storage or a Logging Truck, and 1 per two goods sold on a Jack's own market run. No XP for idling, empty trips, partial whacks or combat.*
- *Decision: cap XP at 1,200 and persist it in save format 4. Versions 2 and 3 still load; Jacks without XP start at zero.*

## 29. Construction takes time (14 Nov 2026)

> Building something new should take some time.

- Player-placed buildings, village upgrades and palisades take time instead of completing instantly.
- Show construction sites, scaffolding and progress; show build times before purchasing.
- Pay once at the start. New buildings provide no housing, processing, healing, tower fire or extra sight until complete.
- Existing village services remain active at the old tier while an upgrade is built.
- Unfinished sites reserve their footprint and count towards purchase limits/prices. Destroyed sites never complete.
- *Decision: Bunkhouse 12 seconds, Sawmill 18, Guard Tower 20; Cabin upgrade 15, Lodge 25, Town Hall 35; palisade sections 3 seconds each. Construction is automatic at normal game time and pauses with the game.*
- *Decision: palisades start as fragile 1-HP stakes and reach full strength only when finished. The starting tent remains part of the narrated arrival; equipment purchases, worker training and road deliveries keep their existing behavior.*
- *Decision: save format 5 preserves construction progress; formats 2–4 remain loadable as completed structures.*

## 30. Bulldozers uproot stumps for more wood (14 Nov 2026)

> Bulldozers can clear roots from the land as well. Leaving the land barren and muddy, but still extracting more wood.

- Bulldozers can uproot the stumps left by harvested trees, manually or automatically within their nearby work area.
- Each stump can yield extra wood only once. Uprooting leaves plant-free, barren mud without counting as another felled tree.
- *Decision: roots take three seconds and yield two wood. Bulldozers carry up to 16 recovered wood and deliver it to camp or a waiting Logging Truck; wood enters village stock only on delivery.*
- Bulldozers continue clearing nearby rocks and filling rivers on explicit orders. Stop orders still hold them in place with their cargo.
- Show muddy ground on the map/minimap, a roots-specific work status, and the bulldozer's cargo.
- *Decision: save format 6 adds the muddy terrain value while retaining existing job/cargo fields; formats 2–5 still load.*

## 31. Opening story, opening screen and Finland (14 Nov 2026)

> - There should be an opening story. You're software engineer, that lost his job because of AI. You have to provide for your young family. Then a job offer comes along: you can become a lumberjack! First assignment: clear a plot of land of trees. Destination Finland. Create a nice opening screen where you can start a new game. Then the story is told while you're in the truck in the forest. The end sequence should wrap this up, surprising both the player (main character) and the viewer that this new job was about making more AI data centers!
> - As this is in Finland, check if we can make the design & animals more Finnish.

- **Opening story**: the player is a software engineer who lost his job to AI and has a young family to provide for. A job offer arrives: become a lumberjack. First assignment: clear a plot of forest in Finland.
- **Opening screen**: a proper title screen from which a new game is started.
- **Telling the story**: it is told during the truck ride into the forest.
- **Ending**: it closes the story. The main character and the viewer both find out only then that the job was about building more AI data centers.
- **Finland**: make the design and the animals more Finnish.
- *Decision: the opening screen is a painted night scene of a lake under the northern lights with a red cottage. It offers New game, plus Continue when a save exists. The how-to-play dialog stays behind the ? button.*
- *Decision: the story is the first five lines of the narrated arrival ride (entry 25), told by Jack in the first person, followed by the four tutorial lines. Each line gets reading time for its length, and a tap, Space or Enter moves to the next line.*
- *Decision: the opening says an AI took his job but never what the land is for ("I didn't ask what the land is for"), so the ending stays a surprise.*
- *Decision: the ending is now a conversation. Jack answers Mr. Grant three times, realising he cleared the forest for the thing that replaced him. The end screen adds that his family is provided for.*
- *Decision, Finnish design:*
  - *Trees are spruce, Scots pine (in place of oak) and birch.*
  - *Deer became reindeer, and whooper swans swim on open water until it is filled in. Wolves, bears and red squirrels already fit.*
  - *Houses are red wood with white trim and dark roofs, flying the Finnish flag.*
  - *Bushes carry lingonberries or bilberries.*
  - *Hired jacks have Finnish J-names (Jaakko, Jukka, Johanna…).*
  - *Prices are in euros.*
- *Decision: map generation is unchanged (no extra lakes), so existing saves still load. Swans appear only in new games.*
- *All new lines are in `js/lines.js`, so they show up in the recording booth. None are recorded yet.*

## 32. More natural truck wobble (14 Nov 2026)

> Wobbling of the truck can be more natural.

- A driving truck should wobble naturally instead of bobbing up and down at a fixed beat.
- *Decision: moving vehicles ride level most of the time and hit short bumps at irregular moments, usually one pixel and now and then two. The bumps depend on the ground covered and the time driven, so fast trucks rattle more than slow ones. The rider on the opening drive bounces a beat after the truck. Applies to all vehicles.*

## 33. Smoother, faster opening drive (14 Nov 2026)

> Mmmm, still not very smooth, maybe the truck is too slow?

- The opening drive should look smooth, and the truck should not crawl.
- *Decision: the camera is locked to the truck during the drive, moving in the same whole pixels at the same moments. Before, the camera eased after the truck, so the two stepped at different moments and the truck shook from side to side.*
- *Decision: the truck drives at about 30 pixels a second, up from about 15. Only the five story lines are told on the road (about 36 seconds).*
- *Decision: the four how-to-play lines moved to after arrival ("At camp"), with the truck parked, the tent up and Jack out of the truck. The game starts when they finish; a tap still skips a line. This changes the narrated arrival of entry 25: the tutorial is no longer given while driving.*

## 34. Ground the cottage on the opening screen (14 Nov 2026)

> House in intro seems to be floating in black a bit, can you integrate it more into the scene?

- The cottage on the opening screen should sit in the scene, not float on black.
- *Decision: the near shore is now moonlit grass instead of a black silhouette, rising into a low headland under the cottage. Lamplight from the windows and door pools on the grass. Bushes, ferns, flowers and a boulder stand against the cottage, and a trodden path leads from the door to a jetty with a rowing boat. On narrow screens the cottage stands further up the bank so there is grass in front of it.*

## 35. Tapping through the story does not move the truck (14 Nov 2026)

> Tap to continue, should not fast forward the truck.

- A tap during the opening only moves the story to the next line. The truck must not jump ahead.
- *Decision: the story and the drive now run on separate clocks. Untouched, the last story line still ends as the truck arrives. If the story is tapped through early, the text box closes and the truck drives the rest of the road in silence, picking up speed smoothly to 120 pixels a second, with no jump. The how-to-play lines start once it has parked. This replaces the jump-ahead described in entries 31 and 33.*

## 36. Normal fog reveal during the opening drive (14 Nov 2026)

**Status:** §42 removes pre-explored terrain; the normal vehicle reveal radius and update cadence remain active.

> Fog of war in truck intro should be as in normal game. It’s too narrow now.

- Intro vehicles reveal nearby terrain using the same radius and update cadence as normal gameplay.
- Keep explored terrain revealed behind the truck instead of showing only the narrow pre-explored road.
- *Decision: run the existing unit fog update during the intro, without starting gameplay, wages or enemy timers. Story and tutorial timing are unchanged.*

## 37. Slower working trucks (14 Nov 2026)

> Truck is too fast when going back and forth.

- Slow ordinary market and Logging Truck journeys, both loaded and returning empty.
- *Decision: use 96 pixels/second on roads (previously 160), 60 on trails (100), and 36 on open ground (55). Trucks retain their carrying capacities, and roads remain the fastest route.*
- The narrated arrival and its separate story/skip pacing are unchanged.

## 38. Audible market deal notifications (14 Nov 2026)

> Deals for a better price on wood/lumber should have a sound effect to make it more noticeable.

- Play a noticeable, distinct sound when a new wood or lumber market offer appears.
- *Decision: replace the ordinary button click with a short rising market chime. Play it once per new offer, not on every update, acceptance, dismissal or save restoration.*
- Respect the existing mute and audio-unlock controls; prices, payouts and recorded voice volumes are unchanged.

## 39. Move orders let Jacks retreat from combat (14 Nov 2026)

> You can abort an attack by jacks (attacking wolves) if they’re attacked by moving them out.

- A valid move order immediately cancels a Jack's attack and takes priority over automatic retaliation, including after further hits.
- Enemies can still chase and damage retreating Jacks; normal self-defense resumes at the destination or after a new attack order.
- *Decision: cancel the retreating Jack's unfired laser-burst shots, but keep bolts already in flight and other units' bursts. Unreachable move orders leave the current task unchanged.*

## 40. Huts are persistent sources of village defenders (14 Nov 2026)

> Locals will keep defending their village until their village is destroyed.

> yeah if you come near their village they get mad, the locals huts are where they originate. Destroying the hut removes that source of locals from the game - but there should be more.

- Locals defend their own village when player units approach, even before level 5; distant villages remain peaceful.
- Living huts are the source of defenders and later raiding parties. Destroying one permanently removes that source, not the other villages.
- Jacks can attack a visible hut by clicking/tapping it. Show damage and remove the hut when destroyed.
- *Decision: new maps aim for 12 huts instead of 7, retaining separation from the camp and market road. Existing saves retain their original layout and tree totals.*
- *Decision: approaching within six tiles or ordering an attack angers that hut. It maintains up to two defenders, replacing losses every 20 seconds. Defenders engage threats within eight tiles of home and return home when intruders leave; wave losses, timers and raids do not dismiss them.*
- *Decision: huts have 200 HP and can be attacked with axes or lasers. Destroying a hut makes its surviving locals withdraw; there are no replacement war parties from arbitrary forest tiles. Hut destruction is not required for the ending.*
- Level-5 raid timing and raider retreat rules remain unchanged; village defense is independent of those raids and remaining tree counts.
- *Decision: save format 7 preserves hut layout settings, damage, anger and destruction. Formats 2–6 remain loadable.*

## 41. Intro truck follows the road (14 Nov 2026)

> Truck should follow the road in intro.

- The opening truck follows the generated road and bridges instead of taking shortcuts through clear ground.
- *Decision: use a road-only, four-direction route, with a final short turn off the road into the existing camp parking spot. No diagonal corner-cutting.*
- Story pacing, skipping captions, regular hauling routes and existing saves are unchanged.

## 42. Start fully hidden and explore during the intro (14 Nov 2026)

> There should be complete fog of war when starting, clearing it for first time when intro is rolling.

- New games begin with the entire map unexplored, including the market road and campsite.
- The intro truck reveals nearby terrain for the first time as it drives along the road, using normal vehicle sight. Previously explored terrain stays visible behind it.
- *Decision: remove initial road/camp reveals and prevent the reserved, unbuilt tent from revealing the campsite. The truck's first simulation update starts exploration; arrival and the normal unit sight reveal the camp.*
- Saved games retain their explored terrain. Starting another new game resets exploration completely.
- **Supersedes** §10's pre-explored-road requirement and refines §36. Story timing and save format are unchanged.

## 43. Truck speed is independent of direction (14 Nov 2026)

> Truck speeds should be the same when going horizontal or diagonal.

- Market and Logging Trucks travel at the same physical speed horizontally, vertically and diagonally on the same terrain.
- *Decision: measure speed as world pixels traveled per second; diagonal X/Y components are normalized rather than each receiving the full horizontal speed.*
- *Decision: retain §37's terrain differences: roads/bridges 96 pixels/second, dirt/gravel 60, open ground 36. Direction alone must not change these speeds.*
- The existing movement already normalizes distance. Added regression coverage for both truck types in all eight directions on each surface; no production movement change was needed.


## 44. Useful and distinct forest collection trucks (14 Nov 2026)

> Jacks are not bringing wood to loading trucks, loading trucks are not useful right now.
> Trucks that collect wood should look different than trucks that go to the market.

- Jacks must deliver harvested wood to a nearer reachable waiting Logging Truck, including as their work moves deeper into the forest.
- Forest collection trucks and market trucks must be visibly distinguishable in the world and shop/selection icons.
- *Decision: remove the arbitrary eight-tile collection cutoff; the existing path search chooses the nearest reachable collection point or camp. Stopped, moving, destroyed and full trucks remain unavailable.*
- *Decision: a partial load waits eight seconds after its last delivery, and waits for carriers already approaching it. A full truck still departs immediately; partial loads leave when no carrier is approaching. Wood becomes village stock only after the truck physically returns and unloads.*
- *Decision: Logging Trucks are green forest forwarders with open steel stakes and a folded yellow loading crane. Red market trucks retain their wooden bed; both display their load.*
- Saves remain compatible; no saved fields or format change.

## 45. Felling tractors and forest discoveries (14 Nov 2026)

> Introduce more vehicles capable of cutting down trees, or other ways to speed up tree removal.
> You should be able to find things in the forest. E.g. treasures, gold and recipes better.

- Add another tree-cutting vehicle and practical ways to improve clearing productivity.
- Reward forest exploration with collectible treasure, gold and useful recipes.
- Show discoveries in the world and a notebook; preserve finds and recipe bonuses in saves.
- *Decision: a Felling Tractor unlocks at level 4 for €480, carries 24 wood, fells a tree in 2.4 seconds and costs €18 per payday. Its compact orange saw-head sprite differs from the later green Harvester. Turbo Harvesters also improves tractors.*
- *Decision: twelve seeded buried finds are spread through the forest without changing map generation. Clear the tree above a visible golden glint and bring a Jack or vehicle within 24 pixels to recover it. Gold yields €90 and cash boxes €180. Three recipes permanently improve Jack chopping by 15%, Jack carrying by four and sawmill processing by 20%. The ✦ notebook shows recipe effects and recovery progress.*
- *Decision: save format 8 stores collected finds and recipes. Formats 2–7 remain loadable, gaining the same seeded finds while retaining their existing forest and progress.*

## 46. Sharing, installation and analytics (14 Nov 2026)

> Add nice social sharing etc metadata. Anything you’d expect from a game/website like this.
>
> Make it PWA ready.
>
> Add plausible from koenvangilst.nl, for subdomain: lumber-jack.koenvangilst.nl

- Add descriptive search metadata, a canonical URL, Open Graph and Twitter cards, a social preview, icons, structured game data, a sitemap and crawler instructions. Preserve the ending surprise.
- Offer native sharing with clipboard/manual-copy fallbacks on the opening screen.
- Add an installable web app manifest, device icons, standalone display and an offline game shell.
- Reuse the existing self-hosted Plausible script and event endpoint from koenvangilst.nl, with `lumber-jack.koenvangilst.nl` as its tracking domain.
- *Decision: the share preview uses the game's own Finnish lake and northern-lights artwork. Website actions stay on the opening screen.*
- *Decision: cache a complete, versioned game shell. New versions wait for old game tabs to close. Never cache the recording booth, its write API, analytics or recordings; offline voices fall back to text. Existing browser saves remain in localStorage.*
- *Decision: the production domain is `https://lumber-jack.koenvangilst.nl/`; Plausible must have that site registered in its dashboard. HTTPS hosting is required for installation outside localhost.*

## 47. Map-edge navigation and black padding (14 Nov 2026)

> Fullsize map is not easy to navigate, some pieces are hidden behind the UI. Add more black padding?

- Let players pan beyond every map edge so edge tiles can be brought clear of the HUD, minimap and selection controls.
- Show a dark, nearly black margin outside the forest.
- Keep unexplored tree overhang hidden by fog at the map boundary.
- *Decision: allow half a viewport of overscroll on all four sides at every zoom, including when the entire map fits onscreen. Existing minimap, wheel, touch and keyboard controls share these bounds. Mention the margin in Help.*
- *Decision: extend the fog mask four tiles beyond the map using the nearest edge tile's exploration state, preserving explored canopy overhang while covering hidden trees. Tree sprites also require their root tile to be explored, preventing a hidden canopy from leaking through an explored neighbor.*

## 48. An interface of its own: painted boards, not Stardew wood (14 Nov 2026)

> It looks very much like stardew valley right now. Up until the UI components. Make those look less like Stardew Valley. The game can be inspired by it, but it should not be a copy.

- The interface components (HUD chips, toolbar, selection panel, shop, dialogs, story boxes, order notice, minimap frame, buttons) must have their own identity rather than the brown-wood-and-gold look of Stardew Valley.
- *Decision: take the look from the game's own setting. Panels are painted like the Finnish houses in the game: punamulta red vertical boards with a white eaves board along the top and a tarred outline. Buttons are white-painted trim with dark lettering; quiet buttons are a deeper red.*
- *Decision: square, pixel-sized corners (2px) instead of rounded wood; flat paint instead of gradients; DIN-style sign lettering (DIN Alternate, Bahnschrift, condensed fallbacks) instead of a rounded face. Still no font files or other dependencies.*
- *Decision: ochre yellow marks money, names and XP; spruce green marks progress and "accept"; a chip turns white with red figures when in debt. The market order is a white notice with a red edge, no longer a tilted parchment note.*
- *Decision: colours live in CSS custom properties at the top of `css/style.css`, so later interface work shares them. The logo keeps its lettering, repainted white and ochre.*
- World art, sprites, the opening-screen scene, the recording booth and all behaviour are unchanged. The offline shell cache is bumped to v2 so installed copies pick up the new stylesheet.

## 49. Predictable navigation and controls (14 Nov 2026)

> Improve navigation & UX in the game. It should be easy and predictable as users are used to for these kind of games.

- Controls follow the conventions of strategy and management games, on mouse, touch and keyboard, and every action gives visible feedback.
- **Pause menu**: the ≡ button, Esc or P pauses and offers Back to work, How to play, Sound on/off and New game. New game asks for confirmation first.
- **Escape backs out one step at a time**: a dialog, then placement or palisade mode, then the shop, then the selection, and only then the pause menu. Enter presses a dialog's main button.
- **Feedback**: a move, attack or bulldoze order leaves a short marker where it landed (white, red, orange). The mouse cursor shows what a click will do: pointer on units and trees, crosshair on animals, huts and while placing, a grabbing hand while dragging the map.
- **Selection**: Shift-click adds or removes a unit, Shift-drag adds a box, Ctrl/⌘+A selects every jack, Shift+1–9 saves a group and 1–9 recalls it (twice jumps to it).
- **Finding things**: an idle-jack button with a count (Tab) cycles through jacks with nothing to do and centres on them; H or Home jumps to camp; F or Space still jumps to the selection.
- **More keys**: B opens the shop, X stops the selection, M toggles the minimap. Toolbar tooltips name their keys. The Stop button is a square rather than a cross, and is dimmed with nothing selected.
- **Phones**: a map button shows the minimap, which small screens did not have. The shop opens as a sheet above the toolbar, hides the selection panel while open and closes when the map is tapped.
- **How to play** is three short paragraphs and a controls table. The table only shows the columns for the input the device has.
- *Decision: keep §11's trackpad model: two-finger scroll and the wheel pan, pinch and the buttons zoom.*
- *Decision: a click or tap on open ground still moves the selection, and right-click does the same. Touch has no second button, and one rule for both is easier to learn than two. Deselect with Esc, the ✕ in the panel or an empty box.*
- *Decision: groups use Shift+digit to save because browsers reserve Ctrl/⌘+digit for switching tabs. Groups last for the session and are not saved.*
- *Decision: a clicked button gives the keyboard back, so Space and Enter never re-trigger the last button pressed.*
- *Decision: the idle hint now points to the idle button. Idle means no task, no path, not told to stop and not fighting, the same rule the hint already used.*
- Saves and game rules are unchanged. The offline shell cache is bumped to v3.

## 50. Music for the opening, play and other scenes (14 Nov 2026)

> Compose nice music for intro, playing and other scenes.

- The game has original music for the opening screen, the opening drive, play, and the other scenes.
- *Decision: music is composed as data and synthesized in the browser, like the sound effects: scores in `js/songs.js` in a short text notation, played by a sequencer and eight synthesized instruments in `js/music.js`. No audio files and no dependencies.*
- *Decision: six pieces, all original, with a Finnish colour (a plucked kantele-like voice, a flute, a bowed jouhikko-like voice, frame drum):*
  - *"Revontulet" on the opening screen: 5/4, the metre of the old runo songs, in D dorian.*
  - *"Maantie" during the opening drive: sparse and quiet, so Jack's story is heard over it.*
  - *"Savotta" while playing, levels 1–4: a working tune in D, with the melody resting every fourth section.*
  - *"Korpi" while playing, from level 5: the same camp further in, slower and in the relative minor.*
  - *A drum-led piece while a war party is attacking; the play music returns when it retreats.*
  - *The ending theme: the camp tune's opening, slowed and turned minor, on bells. Mr. Grant arrives and talks in silence; the theme starts when construction does. Nothing before the ending hints at it.*
- *Decision: songs cross-fade over about a second and a half when the scene changes. The sequencer runs from the frame loop, so a hidden tab falls silent and resumes where it left off.*
- *Decision: the ♪ button now mutes everything, music included. Music has its own on/off in the pause menu, remembered in the browser (`lumberjack-music`), separate from saves.*
- *Decision: browsers only allow sound after a first tap or key press. The first one anywhere, including on the opening screen, starts the audio, so the title music begins then rather than on page load.*
- Added tests that every score parses, fills whole bars and that tracks of one song line up. The offline shell includes the two new scripts and is bumped to v4.

## 51. Full-campaign playtest: dead ends removed, losses made recoverable (15 Nov 2026)

**Status:** §86 acts on the observations left open here: guard towers, unspent money and the quiet last minutes. The fixes in this entry remain active.

> Test & review game mechanics. Make sure the game is engaging, fun and unpredictable up until the end.
>
> Use the playtesting results to identify and correct gameplay issues.

- Play the whole campaign, not only the opening, on many maps and with weaker play styles, and fix what that demonstrates. §27 covered the opening and controlled late-game fixtures; much has been added since.
- *Decision: add `tests/campaign.cjs`, a scripted player that plays from the tent to the ending with legal commands only and reports pacing per level, deaths and their cause, vehicles lost, raids, debt, idle time and stalls. Styles: careful, slow (acts every six seconds), never attacks huts, never builds towers.*
- **Measured before the fixes** (16 maps, careful play): none of the first five maps reached the ending. Once the scripted player itself was competent, 10 of 16 finished; the rest ended in sealed-in villages, frozen crews or wipe-outs. About 29 jacks died per campaign.
- **Dead ends found and removed:**
  - A bulldozer sent to a rock or river first uprooted every stump along its route, with trips home to unload, so opening a way through could take many minutes. *Decision: an order clears only rock and water on the route plus the tile pointed at. Automatic root-pulling nearby (§30) is unchanged.*
  - Buildings could be placed so that they sealed the camp, or an empty pocket beside it, off from the road. Nothing could then be sold and new jacks appeared inside the pocket; there is no way to demolish. *Decision: a building may not cut any walkable ground off from the road. The refusal message says so.*
  - A jack standing on a building site that was hemmed in stayed embedded in the new building for good. *Decision: he always steps out to the nearest free tile, and units whose route crossed the site plan a new one.*
  - A hauler whose way to the market was blocked kept his load for ever. *Decision: the load goes back into stock.*
  - An attack on a hut with no free tile beside it (huts stand among trees) left the jacks waiting silently for ever. *Decision: jacks attack a hut from anywhere within reach of their weapon; if there is no such spot they say so and go back to work. Supplements §40.*
- **Losses made recoverable:**
  - Losing the last jack ended the game at once, even with money to hire another. *Decision: the game is only lost when nobody can fell trees, nobody is in training, and a jack cannot be afforded even after a truck sells the stock. Otherwise a message and the hint say to hire.*
  - Crews were picked off one by one: with a slow player 5 of 8 maps ended in a wipe-out around minute 30. *Decision: a jack below 35 health falls back by himself to the nearest place that heals (the camp or a guard tower), rests to 80 and then picks his job back up. He does this once per wound, so a new order from the player overrides it; a jack told to stop stays put. §39's manual retreat is unchanged.*
- **Measured after the fixes:** careful play finishes 16 of 16 maps in 26–48 minutes of game time with about 8 deaths; the slow player finishes 8 of 8 with about 15; no towers 8 of 8. No stalls, no debt spirals, no game overs. War parties keep coming until about seven minutes before the end and wolf packs until the end.
- *Decision: levels, prices, wave sizes and wildlife strength are unchanged. The pacing held up (levels 2–8 take two to three and a half minutes each, the last two longer), so the fixes target dead ends and unrecoverable losses rather than numbers.*
- **Observed, not changed** (judgment calls for a person): money piles up once everything is bought (about €28,000 unspent at the end); guard towers make little measurable difference; after the last hut falls only wildlife remains for the final minutes; a style that never attacks huts can end with a few trees it cannot reach.
- A scripted player finds dead ends and balance cliffs. It cannot judge fun, and a person has not played these changes through.
- Added eight regression tests, each failing on the previous code. Saves are compatible; a falling-back jack reloads into the job he left. The offline shell cache is bumped to v5.

## 52. Codebase review and refactor (15 Nov 2026)

> Review codebase and refactor to improve.

- Review the code and improve its structure without changing how the game plays.
- *Decision: behaviour must be provably unchanged. Whole campaigns from the scripted player (§51) are deterministic per map seed, so the reports for three seeds were saved before the refactor and compared after every step; all stayed byte-identical, alongside the 142 tests.*
- *Decision: move the peaceful wildlife (reindeer, squirrels, swans, the forest folk pottering about their huts) and the butterflies out of `game.js` into `js/critters.js`. None of it affects the rules, and `game.js` drops from 1,483 to about 1,380 lines. The two updates are still called at their original points in the frame, so the order of random draws is the same.*
- *Decision: name the tile arithmetic. `colOf(i)` and `rowOf(i)` replace about 80 hand-written `i % W` and `(i / W) | 0` in `game.js` and `combat.js`; `midX(i)` and `feetY(i)` give the pixel where a unit on a tile stands. The inner loop of the path search keeps plain arithmetic.*
- *Decision: remove dead code: the `sellRun` unit state, which nothing ever set, and four exports nothing read (`LJ.chip`, `LJ.RESERVE`, `LJ.sightOf` and locals left unused by the helpers). `LJ.tileOfPx` stays, now used by `critters.js`.*
- *Decision: say things once: `LJ.hireCost()` for the price of the next jack (was spelled out in three places), `modalOpen()` in `ui.js`, and one `put` helper in the test harness for standing a unit on a tile.*
- *Decision: add `make test` (syntax check plus tests) and `make playtest SEEDS="1 2 3"`; list them in the README and the notes for coding agents, which no longer say there is no test suite.*
- *Decision: leave the larger files' shape alone. Splitting the shop, building placement or the opening drive out of `game.js`, or the minimap and hints out of `ui.js`, would mean exporting a dozen private helpers each; that trades one kind of clutter for another without a clear gain.*
- Rules, saves and the interface are unchanged. The offline shell lists the new script and is bumped to v6.

## 53. Sourced animal sound effects (15 Nov 2026)

> Search online for suitable animal sound effects, for all animals. Use these. Replace existing recordings if you find new ones.

- Search online and integrate suitable sound effects for every animal in the game.
- Replace existing animal recordings where suitable replacements are found.
- Keep source, creator, license and adaptation details with the distributed recordings.
- **Status:** §55 specifies the playful cartoon style.

## 54. More efficient agent instructions (15 Nov 2026)

> review last sessions and improve agentic instructions to be more efficient next time

- Review recent game-development sessions and improve repository instructions using observed friction.
- Preserve the game's design constraints and the chronological requirements log.
- *Decision: update the actual test commands and use `index.html` as the script-order source of truth, replacing the stale duplicated list. Keep `CLAUDE.md` as an include of `AGENTS.md`.*
- *Decision: assign shared-file ownership and serial main integration when delegating; handoffs carry commits, validation and decisions. Reuse already-read context and repeat checks when changes justify them.*
- *Decision: include targeted browser, offline-cache and legacy-save checks for the integration problems observed in the recent logistics/forest/PWA and interface/navigation/music sessions.*

## 55. Playful animal voices (15 Nov 2026)

**Status:** credits access and presentation are superseded by §62 and §63; animal audio and provenance remain active.

> Not real sounds, playful and suitable for this game

- Use expressive cartoon animal voices that suit the game's pixel art and humor.
- *Decision: adapt rubberduck's CC0 mouth-performed creature pack into eight short, distinct wolf, bear, reindeer, red squirrel and whooper swan cues. Replace all five existing wolf/bear recordings; human and forest-folk takes stay unchanged.*
- *Decision: peaceful animal calls come only from explored, on-screen critters that have not vanished. One shared 10–20-second interval and lower volume keep the forest lively without crowding the music or dialogue. They pause with gameplay and stay silent in the opening drive and ending.*
- *Decision: use the existing voice mixer, global mute and editable recording-booth pipeline. The transient call timer resets on new games and loading; the save format is unchanged. Recorded sounds still require a connection, following the existing offline policy.*
- *Decision: show audio credits and previews through a link in Help; retain the original archive URL, filename mapping, CC0 license and edits in `audio/CREDITS.md`. Bump the offline shell to v7 for the changed scripts and credits page.*

## 56. Review before pushing: displaced units stay on connected ground (15 Nov 2026)

> Review, commit and push.

- Review the unpushed playtest and refactor work before it goes to the remote.
- *Decision: one finding. §51 moves a unit off a hemmed-in building site by searching through anything for the nearest free tile, which could set him down in a walled-in nook or across water. From a site the road reaches, he is now set down only on ground the road still reaches. Added a regression test that fails on the previous code.*
- The rest of the review found nothing to change. Whole scripted campaigns are still byte-identical to the pre-refactor baseline. The offline shell cache is bumped to v8.

## 57. Welcome screen covers the first paint (15 Nov 2026)

> Fix: there’s a flash of underlying ui when refreshing page before welcome screen is show.

- Cover the underlying game UI from the initial HTML, including while scripts are loading.
- *Decision: the title starts with its existing `open` class instead of waiting for JavaScript to reveal it. The existing title rendering and close transition still apply.*

## 58. Subtle interface animations (15 Nov 2026)

> Add small and subtle animations to the ui elements. To make them more fun to use.

- Add short, restrained feedback to controls and opening panels without slowing interaction.
- *Decision: 90–120 ms button transitions, a one-pixel hover lift for toolbar/HUD buttons, 160–180 ms entrances for the shop, selection panel, dialogs and welcome buttons, and a single small pop for the shop notification.*
- Respect the operating system's reduced-motion preference; avoid continuous decorative motion.

## 59. Creator and source-code credits (15 Nov 2026)

**Status:** the standalone credits page and welcome footer links are replaced by the popup in §62 and §63; creator and source-code links remain in that popup.

> Add credits with link to my website and source code.

- Link to Koen van Gilst's website and the game's source repository from the welcome screen and credits page.
- *Decision: use `https://koenvangilst.nl/` and the verified Git remote's repository, `https://github.com/vnglst/lumber-jack-2026`. Keep wildlife sound attribution and previews on the credits page.*
- The offline shell is bumped to v9 for the welcome-screen, animation and credits changes.

## 60. Agent notes from the interface, playtest and refactor sessions (15 Nov 2026)

> Review last couple of sessions. How can agents file be improved? Implement those.

- Review the recent sessions for friction and put what would have prevented it into `AGENTS.md`. §54 did this for delegated work; this entry covers what it left out.
- *Decision: other chats sharing `main`. Read files in your own worktree, never work over a merge in progress or changes you did not make, choose log numbers and the cache version at merge time, and push only when asked.*
- *Decision: testing. A regression test must fail on the previous code, with the recipe for checking it; the two tests that load one file against hand-written stubs are named; a stalled scripted campaign is first diagnosed as the player's fault or the game's; refactors keep the order of random draws so campaign reports stay comparable; checks say what they could not judge.*
- *Decision: code. The checklist for a new script includes the test harness; a new unit task lists the five places it touches; the placement and movement invariants from §51 and §56 are stated; a `misc` voice line must be added to a booth group by hand (the notes said this was automatic); interface conventions from §48 and §49 are recorded.*
- *Decision: tools. Short, single-purpose shell commands, so they match the user's allow rules; plain git diffs past the external diff tool; zsh word splitting.*
- No game code changes.

## 61. Palisades block every unit (15 Nov 2026)

> Palisades should block Jacks as well (or any unit).

- Palisades obstruct Jacks, all vehicles, hostile units and walking wildlife; player units must find an opening instead of passing through walls.
- Apply the same blocking to unfinished stakes and completed sections, including diagonal corners and walls built after a route was planned.
- *Decision: remove the implicit friendly gate behavior. The shop and placement hint explain that players must leave openings for their crews and market trucks. Enemies still have to break a wall before crossing it.*
- *Decision: refuse placement on occupied tiles so construction cannot embed a unit in a solid wall. Existing saved walls gain the blocking behavior without a save-format change; destroying a section opens the route again.*
- *Decision: the ending cancels palisade placement and prevents new wall construction, keeping the visitor's planned route clear.*
- Bump the offline shell for the changed movement and interface scripts. Regression checks cover every player unit kind, wildlife, enemies, live route obstruction, deliberate gaps and saved walls.

## 62. Credits open inside the welcome screen (15 Nov 2026)

> The credits are a dead link, should be an in-game popup, only on the welcome screen. Don't show credits anywhere else. Only as in welcome / new game screen.

**Status:** §63 adds access from the in-game settings menu.

- Replace navigation to a standalone page with a credits button and an in-game popup on the welcome screen.
- Keep creator, source-code and licensed animal-audio attribution inside the popup; remove the credits link from gameplay Help and remove the standalone page.
- *Decision: reuse the game's dialog style. The welcome screen stays visible behind the popup and gameplay stays paused; Back and Escape close it and return focus to Credits. Keep developer-facing source and processing details in `audio/CREDITS.md`.*

## 63. Credits also open from settings (15 Nov 2026)

> There should also be a credits popup from the settings menu in-game.

- Offer the same credits popup from the in-game pause/settings menu, in addition to the welcome screen.
- *Decision: closing credits from settings returns to the paused settings menu. Credits have no separate page or gameplay Help link.*
- **Supersedes** §62's restriction to the welcome screen alone.

## 64. Separate music and effects volumes (15 Nov 2026)

**Status:** §70 moves the controls to a dedicated sound settings submenu; mixer behavior and preferences remain active.

> There should be settings to change the volume of the music and the in-game sound fx.

- Add independently adjustable Music and Sound effects volume sliders to settings, with immediate feedback and percentage values.
- *Decision: the effects slider controls synthesized effects, voices and animal recordings together. Music and its echo use their own volume bus; the existing global mute still silences both buses. Default 100% preserves the existing mix.*
- *Decision: remember both values in browser preferences (`lumberjack-audio-volume`), independently of campaign saves and the existing music on/off preference. Clamp values to 0–100%, tolerate blocked/invalid storage, and smooth changes over 20 ms to avoid clicks.*
- Refresh the offline shell for the popup, settings and mixer changes; the credits popup works offline without fetching a separate page.

## 65. Game sequence testing playground (15 Nov 2026)

> I want to review important sequences of the game, like end sequence, different levels etc. Fighting different animals, locals. etc. Can you create a testing playground where I can review and test these.

- Provide a playground for reviewing and playing important sequences, levels, animal fights and encounters with locals.
- *Decision: `playground.html` runs disposable scenarios in a separate frame with the real game scripts and simulation. It omits the save, normal boot and site scripts, so loading, replaying, finishing and restarting scenarios never loads, overwrites or clears the normal campaign save.*
- *Decision: include the opening drive/tutorial, levels 1–10 with their announcements and threshold clearing, a wolf, a three-wolf pack, a bear, hut defenders, a raiding party and the complete ending. Offer seed, equipment, replay, pause and collapsible controls. Level fixtures have review supplies and a suitable village tier; ordinary shop unlock rules remain intact.*
- Keep the playground separate from normal game menus to protect the ending surprise. Document its address and show it when the local server starts. Like the booth, it requires a connection and is outside the offline shell.
- *Decision: reuse the ordinary animal creation logic without changing its balance or random draws. Campaign reports for seeds 1, 2 and 3 remain byte-identical to the pinned base.*

## 66. Wildlife originals in the recording booth (15 Nov 2026)

> In voices I want to see the newly added sounds from the internet, but also be able to record my own. Especially for the wild life sounds.

- Make downloaded wildlife sounds easy to find, preview and replace with personal recordings.
- *Decision: add a Wildlife sounds filter, animal names, original-source/CC0 links, Internet original and Current game sound previews. Preserve the eight downloaded adaptations in `audio/voice-defaults/`; Use original restores one through the existing local recording API without removing personal takes.*
- Personal recordings use the existing microphone/take workflow and the same game cue keys. Preserve current recordings, including recordings already edited outside this task. Audio files and the recording booth remain network-only.
- *Decision: isolated browser checks exercise recording with a simulated microphone, replacing a sound and restoring its original. API writes are intercepted to avoid changing current recordings. All originals decode; nobody listened to the sounds or tested a physical microphone.*

## 67. Compact mobile Jack actions (15 Nov 2026)

> Can you make the action tab of the jack compacter by using icons, on mobile.

- Compact the selected Jack's action panel on mobile with icons for sawing, hauling, stopping and deselecting.
- *Decision: inline vector symbols use the existing painted controls, with accessible names, tooltips and a Help explanation. Keep desktop text, status and XP. Use 40×44-pixel action buttons in portrait and short touch landscape layouts.*
- Check opening, full late-game HUD, active market offer, shop and actual Stop behavior at narrow portrait, landscape and desktop sizes.

## 68. Play testing and voice recording credits (15 Nov 2026)

> To the credits add: Koen & Tibo for play testing the game and the voice recordings.

- Credit Koen & Tibo for play testing the game and the voice recordings.
- *Decision: add the requested wording to the shared credits popup, visible from the welcome screen and in-game settings.*
- Refresh the offline shell to v12 for the combined game-script, mobile-interface and credits changes. Browser checks cover offline boot and campaign save restoration.

## 69. A clearer mobile game interface (15 Nov 2026)

> Review and refactor the UI on mobile. The screen is too cluttered for practical use right now. It’s fine on desktop.

- Review mobile clutter across the whole interface and make the game practical to use, preserving the desktop presentation.
- *Decision: replace the wrapping mobile HUD with one row for money, wood, Camp and Menu. Camp expands the other resources, population/pay, level progress, stockpiling, discoveries, sound, Help and ordinary guidance. Debt, missing-crew, approaching-raid, active-raid and placement warnings remain visible without opening Camp.*
- *Decision: show market offers and active-order progress as a compact button. Tap it for the existing offer/accept/decline or active-order details. Keep urgent countdowns visible. Camp, market details, minimap and Shop dismiss competing panels; a map tap closes a sheet without issuing an accidental order. Escape backs out disclosures one at a time.*
- *Decision: the selected-unit strip keeps its name, a short status and icon actions. Tap the name for full status, cargo and XP. The bottom dock shows idle jacks, Map and Shop; Map reveals zoom buttons. Remove duplicate Stop and always-visible zoom controls from the mobile dock. Landscape puts selection and navigation beside each other.*
- *Decision: consolidate the compact breakpoint across portrait and short touch landscape. Give the Shop a dedicated scrollable sheet with a sticky close control and 44-pixel purchase targets. Preserve arrival/ending mute access, safe-area padding, keyboard labels and disclosure state. No rules or save-format changes.*
- Browser checks cover 320/390-pixel portrait, 844-pixel landscape, 1024-pixel short touch landscape and desktop, including the opening, full late-game HUD, market offers, stockpiling, XP, navigation and shop. A focused layout check fails against the previous version (166-pixel HUD versus 52 pixels after the refactor). Physical phone testing and judgments about game feel remain for a person.
- Bump the offline shell to v13 for the mobile markup, styles and interface script.

## 70. Dedicated sound settings menu (15 Nov 2026)

> Move music and sound settings to seperate menu. On/off is part of that. Refactor ui.

- Move music and sound controls, including on/off switches, into a separate menu and simplify the parent settings UI.
- *Decision: the pause menu has one Sound settings entry. Its submenu contains the existing All sound/global mute and Music switches plus the independent Music and Sound effects volume sliders. Sound effects include voices and wildlife. Existing mixer behavior and saved preferences stay unchanged.*
- *Decision: ♪ opens the same settings dialog directly, including during the intro and ending, instead of toggling mute immediately. Escape/Back returns one layer to the paused parent menu, or to the original gameplay/intro/ending state for direct entry, restoring focus to the entry control. Switches and sliders update in place without rebuilding the dialog.*
- Keep mobile and desktop layouts compact and accessible, document the new route in Help, and refresh the offline shell to v14. Browser checks exercise switches, sliders, persistence, pause/return behavior and narrow portrait/landscape layouts; nobody listened to the audio.

## 71. Ore: mining, and ore in the shop and the market (15 Nov 2026)

**Status:** §86 lets pickaxes also break up plain rock, and adds a second ore-priced upgrade. The rest remains active.

> Allow extracting ore from rocks and using it as a resource. Integrate this in the gameplay, shop and general economy.

- Some rocks hold ore. It can be extracted, is a resource alongside wood, lumber and stone, and matters in play, in the shop and in the economy.
- *Decision: veins are seeded from the map seed in a separate random stream (`js/ore.js`), like the forest finds, so map generation and existing maps are unchanged. Nine veins per map, each a small cluster of rock tiles beside ground that can be walked up to, 5 to 10 ore per tile: 240 to 400 ore on a map. Explored ore shows as glinting orange metal in the boulders and in orange on the minimap.*
- **Extracting:**
  - *Decision: Pickaxes (level 3, €120) let jacks mine. Tap a glinting rock with jacks selected, or with nobody selected to send the nearest jack. Without pickaxes the tap explains what is needed.*
  - *Decision: one ore takes three seconds (faster with rank, slower in debt, like other work) and earns 2 XP. Ore is heavy: a jack carries six, takes them to camp and comes back, and keeps on with any ore in sight of the spot. Jacks never start mining by themselves; trees stay their default work.*
  - *Decision: a mined-out rock crumbles to gravel and leaves one stone, so mining can also open a way through ore-bearing rock a level before the bulldozer. A bulldozer clearing an ore rock brings in its ore with the stone.*
- **Shop:**
  - *Decision: ore is a fourth cost alongside money, wood and lumber. Overcharged Lasers now also need 10 ore, Steam Sawmills 20, Turbo Harvesters 25 and Mega Haulers 25. New: Steel Axe Heads (level 4, €200 + 12 ore, needs Pickaxes), jacks chop 20% faster. In all 92 ore, a quarter to a third of a map's supply. Money prices are unchanged.*
- **Economy:**
  - *Decision: ore sells at the market for €14 (wood 3, stone 6, lumber 10). Trucks and hauling jacks load it first. Camp keeps 25 ore back for upgrades, as it keeps wood and lumber; Stockpiling keeps everything.*
  - *Decision: once pickaxes are owned and ore is in stock or in sight, about one market order in five asks for ore: 8 to 14 of it within three minutes, bonus €10 each. An active order may use the reserve.*
  - *Decision: an ore chip joins the HUD once pickaxes are owned. The selection panel, hints, How to play and the level-up list cover mining.*
- **Measured** with the scripted player (§51), which now buys pickaxes and keeps two jacks mining while upgrades still need ore: six of six maps finish in 29 to 44 minutes, the same pace as before, with pickaxes bought around minute 5 to 7 and the ore-priced upgrades spread from minute 12 to 30. A player who never mines still finishes four of four, without most of those upgrades and with more losses.
- *Decision: save format 9 stores ore in stock, on jacks and left in each rock, and a mining jack reloads into his job. Formats 2 to 8 remain loadable and gain the seeded veins in whatever rock is still standing.*
- Not judged by a person: whether mining is fun, and the look of the ore on a phone-sized screen, where the HUD now wraps to one more chip.
- Added eight tests (`tests/ore.test.cjs`). The offline shell lists the new script and its cache version is bumped.

## 72. Northern lights mirrored in the lake; playtest with ore (15 Nov 2026)

> Northern lights should be reflected in the water.
> Test game mechanics when done. Make sure game is still engaging and enjoyable.

- The northern lights on the opening screen are reflected in the lake.
- *Decision: this was a bug, not a missing feature. The scene already drew each curtain a second time as a reflection, but the mirror formula placed every row below the near shore, where it was discarded, so the lake never showed any of it. The reflection is now a true mirror about the horizon, squeezed to fit the lake, with the lights' bright lower edge just below the far shore, their tops reaching towards the viewer, and ripples that widen as they come closer. It is a little brighter than the old, invisible setting.*
- *Measured in a browser: aurora-coloured pixels in the lake went from 0% to about 6%, against 16% in the sky. Added a test that every row of the lights is mirrored between the two shores.*
- Playtest the whole game again with ore (the previous entry) in place.
- *Measured with the scripted player (§51), now mining: careful play finishes 12 of 12 maps in 26 to 44 minutes with about 7 deaths; a slow player 8 of 8 with about 9. Before ore: 16 of 16 in 26 to 48 minutes with about 8 deaths. Pacing per level is unchanged, with no stalls, debt or game overs.*
- *Measured: ore is a real choice. A player who never mines finishes 8 of 8, but without most ore-priced upgrades loses about 25 jacks instead of 7 and ends with a third of the money. On each map 60 to 100% of the ore is extracted, the 92 needed for upgrades is always reachable, and the rest is sold. The first ore-priced upgrade arrives between minute 14 and 23 depending on where the veins lie.*
- *Decision: no rule changes from this playtest.*
- Not judged by a person: whether the reflection looks right in motion, and whether mining is enjoyable to play. A scripted player finds dead ends and balance problems; it cannot tell fun.

## 73. Review before merging: a palisade may not seal the camp (15 Nov 2026)

> other agent is done, review, mergen and push

- Review the solid palisades (§61) together with ore (§71) and the northern lights (§72), merge and push.
- *Decision: one finding. Since §61, palisades stop the player's own jacks and trucks, and a palisade cannot be taken down. A closed ring around the camp therefore cut it off from the market for good: the dead end §51 removed for buildings. A test built all 32 sections of such a ring. Now a section that would cut any ground off from the road is not built, and the player is told that an opening was left. This applies §51's rule for buildings to palisades; §61's "leave openings" still describes what the player should do, the game now also guarantees one.*
- *Decision: the rule is strict on purpose. Even a small pocket behind a wall may hold the only way to some trees, and every tree has to go.*
- *Measured after merging all three: the tests pass (199 once the sound-settings and mobile-interface work of §62–70 was merged in as well); the scripted player (which builds no palisades) finishes 8 of 8 maps with careful play and 6 of 6 with slow play, at the same pace as before.*
- Not covered: nobody has played with palisades by hand since they became solid, and the scripted player does not use them.
- The offline shell cache is bumped to v15.

## 74. Menus as one stack of screens; pixel-art icon buttons (15 Nov 2026)

> Can you review these and improve when needed. Also implement the following improvements:
>
> - refactor ui, especially of the menu's, keeping usability on mobile in mind
> - redesign icon buttons that were recently added. Should be more playful.

- "These" were the three gaps left open in §73: the sound-settings and mobile-interface commits of §62–70 had not been reviewed, and solid palisades (§61) and mining (§71) had only been exercised by unit tests.
- **Review:**
  - *The §62–70 code reads correctly: volumes are clamped and remembered, voices share the effects volume, and wildlife spawning was only moved into a shared function. The findings were in the interface and are addressed below: the phone's Camp drawer repeated sound, finds and help, which the pause menu also offers; every dialog hand-coded where Back should lead; and the new action buttons used thin line drawings (a shopping trolley for "haul to market") unlike anything else in the game.*
  - *Palisades: the scripted player (§51) can now ring its camp with palisade (`{ walls: true }`). Seven of eight walled campaigns finish with no stalls, so solid walls and the opening rule of §73 hold up over whole games. The eighth is a real defeat, not a dead end: 16 of its 27 deaths were inside the ring, because one opening makes the camp a trap for jacks falling back to heal. Decision: no rule change; over-walling is the player's risk.*
  - *Mining had already been played through by the scripted player in §72; nothing new was found.*
- **Menus:**
  - *Decision: the menus move out of `ui.js` into `js/menus.js` as screens on a stack inside one dialog: Paused, How to play, Forest finds, Sound, Credits and the new-game question. Opening a screen from another pushes it; Back or Escape pops one; the cross closes everything and leaves the game paused or running exactly as it was. This replaces the per-dialog flags for "opened from the menu" and "opened from the welcome screen". One-message dialogs (level up, game over, the ending) stay in `ui.js`.*
  - *Decision: every screen has the same frame: Back and Close at the top as full 44 px buttons, a body that scrolls, and a footer that stays in place. The pause menu is a list of rows with an icon, a name and a line saying where things stand (finds recovered, current volumes). Forest finds joins the menu.*
  - *Decision: on a phone every dialog is a sheet rising from the bottom edge at full width, so its buttons are under the thumb; rows are 58 px tall. The Camp drawer now holds only resources, progress and the stockpile switch; help, finds and sound are in the menu. The sound screen has whole-row switches instead of small checkboxes and taller sliders.*
- **Icon buttons:**
  - *Decision: the line drawings and text glyphs are replaced by pixel-art icons drawn in code like the rest of the game (`js/art.js`), each a 12 by 12 grid of named colours: a hand saw, a market stall with a striped awning, a red mitten for Stop, a red cross, a folded map, a note, a gold nugget, a speech bubble, a stack of logs for the menu, a heart, a sapling, plus and minus. Icon buttons are cream-painted like the other buttons, so the pictures read on them.*
  - *Decision: on a desktop the selected-unit buttons show the icon beside the label; on a phone the icon alone. Icons wiggle when pointed at and squash when pressed; with reduced motion they do neither.*
- Checked in a browser at desktop and phone sizes: 41 behaviour checks (the back stack, Escape, pause state restored, sound controls, credits from the welcome screen, the new-game question, tap-target sizes) and screenshots of every screen. Added a test that every icon a button asks for is drawn and that each pixel icon is a full grid.
- Not judged by a person: whether the icons read at a glance on a real phone, and how the sheets feel under a thumb.
- Game rules and saves are unchanged. The offline shell lists the new script and its cache version is bumped.

## 75. Fade in the initial welcome screen (15 Nov 2026)

> Can you improve how the game loads initially, by using a fadein.

- Fade in the initial welcome screen as it becomes ready.
- *Decision: keep the opaque night backdrop from §57 covering the game while scripts load. After the first scene is drawn and the start buttons are populated, allow the backdrop to paint, then fade the artwork and controls in together over 700 ms. Later openings do not repeat the startup fade.*
- Respect reduced motion by showing the prepared screen without the opacity transition.
- Syntax checks and all 201 tests pass. Browser verification was blocked by the automation browser's busy profile and no available alternative browser; the appearance and timing in motion have not been visually verified.
- The offline shell cache is bumped to v17. No changes to shell loading, game rules or save data.

## 76. Review the startup fade before pushing (15 Nov 2026)

> Review and push

- Review the startup fade (§75) before publishing it.
- *Decision: fix one finding. Giving the title's children explicit visible status kept the invisible welcome screen intercepting game input after it closed. Once ready, the children now inherit the parent's visibility, preserving its existing close transition and releasing game input afterward.*
- A focused isolated-browser check failed before the fix and passed afterward at desktop, narrow portrait and landscape sizes. It checks the fade in progress, reduced motion, child visibility after closing and clicks reaching the underlying game. The real game also boots, displays the welcome screen and starts a new game with the title no longer intercepting input. An isolated headless browser resolved the verification blocker recorded in §75; a screenshot was inspected, but nobody judged the fade's feel in motion.

## 77. Separate development from the production package (15 Nov 2026)

> Yes split game development from production deployment!

- Separate the local development tools from the files published as the game.
- *Decision: `make dist` packages the resources referenced by `index.html`, install icons, social artwork, service worker, search metadata, license notices and manifest-listed voice recordings. It copies files unchanged into `dist/`, removing stale output. Exclude the recording booth, playground, sprite viewer, development scripts, internal docs, tests, repository metadata and unlisted audio takes.*
- *Decision: `make` remains the development workflow; its server binds to loopback and refuses hidden paths and files outside the source root. `make preview` serves only the static package with no recording API. `make release` checks the source and prepares the package for inclusion in a release commit.*

## 78. Publishing safeguards and licensing (15 Nov 2026)

> Do other recommendations as well.
>
> Production deploy should be just html.
>
> MIT for code and original artwork; reserve personal voice recordings

- Apply the remaining publishing recommendations from the source review.
- *Decision: production is a static HTML/CSS/JavaScript site with assets and audio; no Python process, application backend or recording API. Packaging remains a local release step.*
- Ignore environment files, private-key files and Python cache files. Add the MIT license for code, documentation and original artwork, explicitly excluding audio. Keep downloaded creature recordings and adaptations under CC0 and personal recordings under their performers' reserved rights.
- Document the public credits, Git author email, downloadable voices, performer permissions and the production analytics-domain check. Dashboard registration remains an account-side check.

## 79. Document the Coolify static release flow (15 Nov 2026)

**Status:** §80 completes the hosting transition described here.

> Deployment happens on coolify, check repo in parent folder. Document how it’s deployed without providing details about actual infrastructure and servers.

- Check the existing deployment workflow and describe it without publishing infrastructure or server details.
- *Decision: document immutable source selection, the source updater, Coolify deployment, release verification and rollback. Generated `dist/` belongs in a release commit so hosting only needs to copy static files.*
- *Finding: the current hosting recipe copies only `index.html`, `css`, `js` and `audio`; it omits the PWA files and icons and includes developer scripts. Document the required hosting transition to checking `dist/index.html` and copying only `dist/.`. The hosting checkout has unrelated edits, so leave it untouched; no deployment or push is part of this change.*
- Checked: all 201 JavaScript tests and six deployment checks pass. The hidden-file regression failed against the original development server. The 82-file package boots and starts a game in an isolated browser, serves the production assets, returns 404 for the tested development/private paths and restores the saved campaign after an offline reload without page errors. Analytics dashboard registration and listening to recordings remain manual checks.

## 80. Switch hosting to the static package (15 Nov 2026)

> Switch hosting to dist

- Publish the committed static package through the existing Coolify workflow.
- *Decision: the hosting recipe requires `dist/index.html` and copies only `dist/.`. Packaging stays in the game repository; production serves static files. Use a clean hosting checkout to preserve unrelated local edits.*
- Update the deployment guide to describe the active release flow without infrastructure or server details.
- Verified: Coolify finished deployment of hosting commit `a85bc92`. All 80 packaged game files match the committed release byte for byte; the hosting-generated robots file and sitemap are valid. Ten tested development/private paths return 404. The game HTML, manifest and service worker require cache revalidation. The existing local hosting edits remain untouched.

## 81. Lynx and wolverine join the wildlife (15 Nov 2026)

> Add the Eurasian lynx as one of the wild animals that attacks. Also add another attacking animal.

- The Eurasian lynx attacks, alongside wolves and bears.
- A second new attacking animal. *Decision: the wolverine. With the wolf, bear and lynx it completes Finland's four large carnivores, in keeping with the setting.*
- *Decision: each animal plays differently rather than being a recoloured wolf.*
  - *Lynx, from level 3: hunts alone. A third faster than a wolf of the same level and a fifth frailer, bites a fifth harder, and its first pounce does double damage. It still creeps closer before charging, as all wildlife does. Pelt €25.*
  - *Wolverine, from level 6: comes in pairs. Sixty per cent tougher than a wolf, bites a quarter harder, slightly slower, and tears through a palisade three times as fast, which matters now that palisades are solid (§61). Pelt €30.*
- *Decision: about one encounter in seven is a lynx from level 3 and one in seven a wolverine from level 6. Bears keep their odds (§4), and wolves are whatever is left, never less than a fifth. Levels 1 and 2 remain wolves only. The level-up messages at levels 3 and 6 announce the newcomers.*
- *Decision: per-animal differences move into the `FOE` table (relative health, damage and speed, group size, odds by level, arrival cue and warning), replacing the bear special cases in the spawn code.*
- *Decision: both are drawn in code in the existing style: a tawny, spotted, long-legged lynx with black ear tufts, a white chest and a short tail; a low, dark wolverine with a pale flank band and a raised bushy tail. Each has two walking frames.*
- *Decision: sound. Each gets a synthesized arrival effect now (a rising yowl, a rattling growl) and two cues in the recording booth (appear or bite, and death), which stay silent until recorded, like any unrecorded cue. Jacks have new lines for being pounced on or bitten. Both animals are in the review playground.*
- *Measured with the scripted player (§51): careful play finishes 12 of 12 maps and slow play 8 of 8, at the same pace, with about 10 deaths a game instead of 8 or 9. Over six campaigns there were 45 wolf, 20 bear, 11 lynx and 5 wolverine encounters.*
- Not judged by a person: how the two animals look in motion, and the synthesized sounds, which nobody has listened to.
- Added five tests. Saves are unaffected (wildlife is not saved). The offline shell cache is bumped.

## 82. Playful motion in menus and the interface (15 Nov 2026)

> Add playfull animations to interface elements like menus.

- Menus and other interface elements move in a playful way.
- *Decision: one idea throughout: things arrive like boards dropped into place, with a little overshoot, then stay still. Every animation is short and runs once.*
  - *Menus: the sheet drops in at a slight angle and settles; on a phone it rises from the bottom edge. Its rows are dealt in one after another, each icon popping a beat after its row, all within 0.4 seconds; Back and Close pop in last. Opening a screen from another slides the new one in from the right, Back slides it from the left, and coming back the list is simply there rather than dealt again.*
  - *Messages (level up, game over): the heading is stamped on.*
  - *Counters: money, wood, lumber, stone, ore, crew and the idle count hop when they change; the level badge turns a somersault on a new level.*
  - *Shop: its rows are dealt in when it opens, not each time a price or stock change redraws the list.*
  - *Also: the selection panel hops up from the toolbar, messages drop in, the sound switches snap over with a bounce, and a menu row's name nudges sideways when pointed at. The icon wiggle and squash from §74 stay.*
- *Decision: motion never delays input. Buttons work from the first frame, there is no closing animation to wait for, and a row can be pressed while it is still arriving.*
- *Decision: with the system's reduced-motion setting, none of this plays.*
- Refines §58 (subtle interface animations): its quiet fades for the shop and title buttons remain; dialogs, the panel and the toast now use the livelier motion.
- Checked in a browser at desktop and phone sizes and with reduced motion: 24 checks of which animation each element runs, the order and timing of the rows, input during an animation, and that reduced motion switches everything off; the 41 menu behaviour checks of §74 still pass.
- Not judged by a person: how it feels. Animation was verified as rules and timings and one frame caught mid-flight, not watched.
- Game rules and saves are unchanged. The offline shell cache is bumped.

## 83. Playground source stays current (15 Nov 2026)

> Playground is not always working:

- Fix the scene preparation failure shown in the screenshot: `LJ.spawnWildAt is not a function` when loading a wolf pack.
- *Decision: reproduced the exact message in an isolated browser by keeping an older game API in the active service worker's cache. Current playground fixtures were loading alongside cached production scripts. Serve the playground shell and all its dependencies through the development server's `/__playground__/` URL space, which even an older cache-first worker leaves on the network. Keep campaign saves and the installed game's cache intact. Restart the development server after updating it.*
- Development-only files change; no production shell, game rules or save shape changes, so no offline cache bump is needed.
- Verified the same cached-script reproduction passes after the fix. The boot regression test fails against the pinned base `2013cec`. Server tests cover the source alias and continued rejection of private files; worker tests cover bypass of every shell asset.

## 84. Every playground scene in the test suite (15 Nov 2026)

> check all playground, make them part of test suite.

- Check every scene offered by the playground, including lynx and wolverine, and run those checks through `make test`.
- *Decision: derive scene coverage from the actual menu, require explicit outcome assertions for new scenes, and exercise 444 setups/replays across seeds 1, 42 and 999, all four equipment choices, all ten level announcements and early/middle/late encounter levels. Verify animal kinds/counts, defenders, raids, arrival, ending, equipment and campaign-save isolation. Exercise real combat for all five animal encounter scenes and the full ending separately.*
- Browser checks pass with the stale production cache active: all ten scenes with all four equipment choices, all ten level announcements, full ending/restart, pause/resume, narrow portrait/landscape controls and campaign-save isolation; no page errors. These checks verify behavior, not whether the game is fun or how the audio sounds.

## 85. Playable developed towns in the playground (16 Nov 2026)

> Can you add to the playground a way to play test certain in-game moment. For instance, when you have a successful town at level 5, 8 and 10. Create different scenario's for me to test the game, with a complete town and large parts of the forest cut down.
>
> Create a worktree for this that you merge back to main at the end.

- Add three playable town presets to the existing playground, with completed buildings, crews, vehicles and cleared forest.
- *Decision: level 5 has 8 jacks and 16% clearing; level 8 has 12 jacks and 48%; level 10 has 16 jacks and 85%. Each is within its actual progression thresholds, with forest left to play through. Buildings include housing, sawmills and guard towers; equipment and fleet sizes grow with the level.*
- *Decision: use ordinary purchases, placement and completion to preserve building services and road access. Start logging, sawmilling and market hauling, leaving spare hands and a bulldozer for manual orders. Restore normal wildlife and raid timers after setup. Reveal the map for inspection; supplies and earned income are staged.*
- Presets own their level and equipment, disabling those selectors; seeds remain adjustable. Replay resets the scenario without touching campaign saves.
- Development-only changes: production rules, saves and offline shell are unchanged; no cache bump or production package rebuild is needed.
- Checks cover all presets across three seeds and equipment selections, physical tree counts, completed services, reachable units, continued logging and sales. Isolated browser checks cover desktop, narrow portrait and landscape with no page errors and a preserved campaign save. Nobody has judged game feel or listened to audio.

## 86. Playtest to the end: towers that matter, automation that is earned, a livelier finish (16 Nov 2026)

> Playtest game until the end. Make sure guard towers play an important role. Automation should be important, the game shouldn’t play itself. It should be engaging and fun until the end. Not too hard, but challenging from time to time.

- Play whole campaigns again and change what the playtest shows about four things: guard towers, automation, the last stretch, and difficulty.
- *Decision: the scripted player (§51) now also reports every order it gives, per level, the idle share per level, and what the towers did. New styles: a hands-off player who gives each unit one order and then only shops, a very slow one who acts every 20 seconds, one without a Foreman. `--opts` and `--brief` run them from the command line.*
- **Measured before the changes** (careful play, 8 maps):
  - Towers scored 3 of about 146 kills a game. No war party came within 11 tiles of the village: twenty jacks with laser pistols shot it to pieces in the forest. Playing without towers cost nothing (12 deaths against 11).
  - The hands-off player reached level 8 or 9 in 25 to 35 minutes, the same pace as careful play. Levels 1 to 4 asked for 9 to 17 orders each. The orders came at the wrong end instead: 200 to 390 of a game's 430 were jacks sent on to new trees, mostly in levels 9 and 10.
  - On some maps the last 20 to 100 trees stood inside rock outcrops. One bulldozer opened them one at a time for up to ten minutes, with 18 of 22 jacks idle, no enemies left and money piling up (€22,000 unspent on average).
  - The very slow player finished 3 of 4 maps with 53 deaths.
- **Guard towers:**
  - *Decision: a war party is after the village. It marches on the village and on guard towers, whichever is nearest, a quarter faster than before, and no longer hunts crews in the forest. It and a jack fight each other only on defended ground (within 12 tiles of the village or a tower) or when the jack is ordered to attack it. A hut's own defenders are unchanged (§40). Refines §9, §23 and §27; wave timing, sizes and retreat rules are unchanged.*
  - *Decision: a war party's fighters have two and a half times the health of a hut's defenders. It attacks only towers and the village, not bunkhouses or sawmills; a raid on the village still carries off stock (§27).*
  - *Decision: a tower's gunner aims ahead of a moving target. Before, every bolt landed where a marching enemy had been, which is most of why towers killed nothing. Pistols still do not lead. Towers reach 10 tiles (was 8, twice a bow's reach) and fire four bolts of 18 every second (was three of 13 every 1.3 seconds).*
  - *Decision: jacks within 12 tiles of a building that is hit come to its defence and then go back to work. Jacks told to stop stay put, now also when a crewmate nearby is attacked. A beaten war party is let go, not chased into the forest. A damaged building is patched up at 4 points a second once it has been left alone for 12 seconds; before, damage was permanent.*
  - *Decision: new upgrade, Twin Tower Lasers (level 7, €900 + 15 ore, needs a tower): six bolts a burst, and every tower takes 160 more damage. It gives late money and ore something to do. Ore-priced upgrades now need 107 of a map's 240 to 400 ore.*
- **Automation:**
  - *Decision: a jack clears what he can see from the spot he was sent to, then waits for the next order, as §7 asked ("If they don't see any tree nearby, they just stand there"). Before, his work spot moved with every tree he felled, so one tap kept him busy for the whole game. Felling tractors and harvesters still follow the forest edge by themselves: that is what they are bought for.*
  - *Decision: the Foreman (was Keen-eyed Foreman: sight only) is the crew's automation, moved from level 5 to level 4 at the same €500. With him, jacks follow the forest edge again, and idle jacks and machines walk on to the nearest trees anyone has explored. Unexplored forest, rock, water, huts, ore and the village's defence stay the player's business.*
  - *Decision: the opening truck still sells by itself (§19); purchased trucks still wait for the Dispatcher.*
- **The last stretch:**
  - *Decision: a bulldozer sent to a tile now plans the route that opens soonest: round rock and water where that is quicker, through them only where it is not. Before, it took the shortest line, straight through whole rock fields.*
  - *Decision: with Pickaxes, jacks can break up plain rock: select jacks and tap a rock. Eight seconds a rock (a bulldozer takes 2.5), one stone, one rock per jack: the one pointed at, then its neighbours. So an idle crew can open the last pockets itself. Water still needs the bulldozer. Extends §71; a jack on this errand is saved as idle.*
- **Measured after** (12 maps careful, 8 for each other style):
  - Careful play finishes 12 of 12 in about 30 minutes with 7 to 8 deaths, idle 5% of the time (was 11%), €13,000 unspent. Slow play 8 of 8 with 7 deaths; the very slow player 8 of 8 in 33 minutes with 9 deaths.
  - Towers: no towers 15 deaths a game (13 of them in the village), one tower 13, three towers 7.5 (3 in the village), six towers no better than three. Towers make about 18 kills a game; jacks in the village make the rest.
  - Automation: without the Foreman a game takes 37.5 minutes and about 1,050 orders; with him 31 minutes and 350. The hands-off player now gets to level 5 on average, 58% of his crew idle and in debt; 2 of 8 finish, in over an hour.
  - Orders per level with the Foreman: 20 to 80 in levels 2 to 6, 10 to 20 in levels 7 and 8 once the crew runs itself, 20 to 140 in the last two, where the remaining pockets are opened. The ten-minute idle tail on the worst map is now 17 seconds. War parties still cost the most lives in levels 9 and 10.
- Checked in a browser: a level-8 town in the playground under a raid (ten warriors marched on the village, the towers took four of the nine killed, no jack died, the village took damage and no errors were logged), breaking a rock with a real pointer event, and the shop at phone width with the longer descriptions.
- Not judged by a person: whether any of this is fun. A scripted player measures pace, losses and how many orders a game asks for; it cannot tell whether giving them is enjoyable, whether a raid on the village feels fair, or whether crews that ignore a passing war party look right. Nobody played with palisades and towers together.
- Added 14 tests (`tests/raids-automation.test.cjs`); 11 fail on the previous code, 3 guard behaviour that is kept. Saves are compatible without a new format. The offline shell cache is bumped to v20; the production package (`dist/`) is not rebuilt.

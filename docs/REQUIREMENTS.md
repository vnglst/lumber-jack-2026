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

**Status:** §40 adds persistent hut defenders, independent of raiding-party retreat and last-tree limits.

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

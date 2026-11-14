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

**Version:** 0.9

**1. Vision**

Lumberjack is a beautiful, humorous 2D browser game about cutting down trees, making money, and building an increasingly efficient logging operation.

The player starts with a single lumberjack, called a _jack_, equipped with an axe. In front of him stretches an enormous, lush forest filled with trees, flowers, butterflies, insects, rivers, and rocks.

The player cuts down trees, sells wood, recruits workers, purchases equipment, and gradually automates the operation. Inspired by Factorio, the game should provide the satisfaction of turning a small manual operation into an efficient, highly productive enterprise.

But the game has a secret.

After clearing virtually the entire forest across 10 levels, the player learns that all this work was done to make room for a new AI data center.

The ending is a satirical comment on environmental destruction, deliberately revealed only after the player has enjoyed optimizing the process that caused it.

**2. Visual identity and world presentation**

- Title: **Lumberjack**.
- Logo: "Lumber" in block lettering, with "Jack" positioned diagonally in a contrasting handwritten-style serif font.
- Recommended perspective: **orthogonal top-down RTS**, inspired by Warcraft: Orcs & Humans and Dune II, rather than an isometric view.
- Beautiful, colorful 2D pixel-art-inspired presentation.
- The forest is green, lush, detailed, and full of life.
- Small details include flowers, insects, butterflies, rivers, rocks, and other natural features.
- Character sprites, environment art, and animations must look polished.
- The starting jack should appear small compared with the immense forest.
- As the player progresses, the landscape changes visibly from forest to wasteland.

**Tile-based world**

The world should be built from reusable tiles rather than individually illustrated as one enormous image. This is important because the forest must support a very large, continuous game map.

- Terrain is tile-based, allowing the world to scale to large areas.
- Ground types include grass, dirt, water, riverbanks, and rocky terrain.
- Terrain variations and natural transitions should prevent the map from looking like an obvious grid.
- Trees, vegetation, rocks, buildings, and other objects can visually overlap terrain tiles.
- Forests, rivers, and rocky areas should form natural-looking landscapes rather than regular patterns.
- The grid should support clear unit movement and commands without dominating the visual presentation.

**Visual principle:** The player should barely notice the tiles when looking at the forest, but the world must remain readable when selecting units and issuing commands.

**3. Player controls**

The control model is inspired by Warcraft: Orcs & Humans (1994) and Dune II.

- The player selects one or multiple jacks.
- The player issues commands by clicking a tree or an area.
- When multiple jacks receive an area-clearing order, they divide the trees among themselves.
- They work until the entire designated area is cleared.
- Jacks automatically transport harvested wood and return to their assigned work.
- Once the assigned area has been cleared, they stop and wait for new orders.
- The top-down perspective should make it easy to navigate the map and send units to distant areas.

**4. Starting the game**

- The player begins with one jack equipped with an axe.
- The player receives starting money.
- Purchasing the first village requires money and wood, so some initial logging is necessary.
- The player can choose between saving resources for a village and buying other available upgrades.
- Early upgrades include options for improving logging and transportation.
- The game must be entertaining even with only one jack.
- The first upgrades should become accessible quickly.
- Obtaining additional jacks should be possible relatively early.

**5. Logging and wood production**

**Cutting trees**

- Jacks can cut down trees.
- Cut trees produce wood.
- Cutting and transporting wood are physical activities in the game world.
- Trees disappear permanently when harvested.
- Trees never grow back.

**Before acquiring a village**

- The jack must carry wood off the map to sell it.
- Selling wood earns money.
- Transporting wood on foot is slow.
- Some harvested wood is required to purchase the first village.

**Village**

- The player can purchase and physically place a village.
- The village's primary purpose is training additional jacks.
- Training a new jack takes time.
- After the village becomes available, jacks bring harvested wood back to it.
- The village also supports converting wood into lumber.
- The player assigns a jack to processing, and the jack continues until given another order.
- Processing lumber takes time.
- A jack cannot perform other work while processing lumber.
- Lumber sells for more money than raw wood.
- The player chooses whether to sell raw wood or convert it into lumber.

**6. Transportation**

- Initially, jacks transport wood on foot.
- Trucks become available as an improvement.
- Trucks collect wood from the village.
- Trucks drive off the map to sell their loads.
- After selling, trucks return to collect more wood.
- Initially, the player must command individual truck journeys.
- Transportation can be automated as the game progresses.
- Trucks reduce the time and labor required to transport wood.

**7. Exploration, obstacles, and land access**

The forest contains natural obstacles that influence how the logging operation expands.

- Rivers and rocky terrain can prevent units from reaching certain parts of the map.
- Some forest areas are initially inaccessible because of these obstacles.
- Bulldozers become available as equipment for overcoming terrain obstacles and opening access to new pieces of land.
- Gaining access to previously unreachable forests allows the operation to continue expanding.
- Rocks may also become a harvestable resource, introducing additional possibilities beyond wood production.

The combination of natural barriers and new equipment adds a geographical dimension to progression: the player improves not only how efficiently resources are harvested, but also which areas can be reached.

**8. Equipment, workers, and buildings**

- The player can train more jacks at the village.
- Multiple jacks can work simultaneously.
- Jacks can be assigned to different jobs, including logging and lumber processing.
- Chainsaws improve logging productivity.
- Trucks improve transportation productivity.
- Bulldozers help the player overcome terrain obstacles and reach new areas.
- Money and wood are used to purchase improvements.
- Equipment, buildings, and vehicles exist physically in the game world.
- The player can place purchased objects in the world.
- Some upgrades are available from the beginning.
- Other upgrades unlock at later levels.

**9. Automation and progression**

Automation is central to the game's appeal.

Initially, the player spends time commanding a small number of jacks, cutting trees, and transporting harvested wood. With additional workers, equipment, and improvements, the same work becomes increasingly efficient.

- The player gradually replaces manual commands with automation.
- Increasing efficiency allows the operation to clear larger parts of the forest.
- Better equipment makes previously inaccessible areas reachable.
- The operation eventually becomes capable of removing several hectares of forest.
- The player continues to improve the production process throughout the game.

The sense of increasing productivity should be a central source of enjoyment, inspired by Factorio.

**10. Levels**

- The game consists of exactly 10 levels.
- All 10 levels take place in one continuous forest.
- Levels are progression milestones rather than separate maps.
- Progression is determined by the number of trees cleared.
- Reaching a level threshold briefly pauses gameplay.
- The new level and any newly unlocked improvements are displayed.
- Some equipment and automation capabilities become available at later levels.
- By the end of level 10, virtually every tree has been removed.
- The final landscape is a wasteland.
- Completing the tenth level triggers the ending.

**11. Character personality and humor**

Jacks have humorous interactions inspired by Warcraft: Orcs & Humans.

- Clicking a jack triggers a short response.
- Repeated clicks produce different responses.
- The jack becomes increasingly annoyed.
- Eventually, the jack responds with funny dialogue.
- These playful interactions are part of the game's identity.

Character personality and environmental details should make the game enjoyable beyond its economic and automation systems.

**12. Ending and narrative reveal**

Throughout the game, the player believes the objective is simply to build an increasingly productive logging business.

The actual purpose of the operation and the environmental message are not explicitly revealed before the ending.

After the player completes level 10:

1. A person wearing a suit walks onto the screen and approaches the player.
2. The person congratulates the player for completing the job.
3. The person reveals that the cleared land will be used to construct a new AI data center.
4. The player receives a substantial financial bonus and shares in the company constructing the data center.
5. The game displays **"Game over."**
6. The game asks: **"Do you want to clear another piece of land?"**
7. Choosing yes starts the same game again from scratch.

The revelation changes how the player interprets everything they have accomplished.

The game should be enjoyable in its own right. Its environmental criticism comes through the final narrative reversal rather than an explicit message during gameplay.

**13. Platform and distribution**

- The game runs in a web browser.
- It works on mobile devices.
- It should work across browsers.
- It should be easy to share through a link.
- The visual quality, animations, and overall presentation are important.
- The world should scale to very large maps while retaining its natural, detailed appearance.
- The game should be accessible to a broad audience.

**14. Creative references**

**Warcraft: Orcs & Humans (1994)** — Orthogonal top-down presentation, selecting and commanding units, amusing character reactions, and personality.

**Dune II (1992)** — Top-down RTS interaction, commanding workers, and coordinating activity across a map.

**Factorio** — The satisfaction of continuous optimization, increasing production, and automation.

**The game-design novel** — A late narrative reversal revealing that the player's apparently successful actions served a morally troubling purpose.

**15. Creative freedom and design principles**

This specification establishes the game's core vision and gameplay direction, not an exhaustive list of features.

Creative freedom is encouraged. Introduce new gameplay mechanics, upgrades, buildings, worker behaviors, animations, interactions, and humorous details when they improve the experience and remain consistent with the game's identity.

In particular:

- **Make the early game enjoyable.** A single jack with an axe should already provide an entertaining experience.
- **Make automation satisfying.** Each improvement should make the operation feel more capable and efficient.
- **Make the world feel alive.** Maintain natural-looking environments, interesting details, and character personality, even with a tile-based world.
- **Make expansion rewarding.** Overcoming natural obstacles and reaching new forest areas should be satisfying.
- **Reward experimentation.** Give players meaningful opportunities to discover more efficient ways to operate.
- **Preserve the contrast.** The increasingly efficient operation should visibly transform a beautiful forest into a wasteland.
- **Protect the ending.** The AI data center revelation must remain a surprise.

The guiding principle is simple: **build a genuinely entertaining game about productivity, expansion, and automation, and let the ending change what that entertainment means.**
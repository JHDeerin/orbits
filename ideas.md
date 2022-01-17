# Weekly Game Jam 164 Ideas: "Hurl"

-   Endless runner where your leg is injured in a forest and you have to hobble away from baddies/forest fires/etc; collect 2-3 wood pieces by chopping down wood (with the hatchet you conveniently have) to build a catapult, wind it back, and launch yourself!
    -   As you get farther, overcome obstacles like wolves, angry huntsmen, and stairs!
-   "Orbits" combat idea of having a war across interplanetary distances, hurling increasingly large objects at one another
    -   Could upgrade over time to get longer/more accurate trajectory calculator, along with choosing between sending mining bots/sensors to asteroids with your (long cooldown) cannons and shooting actual deadly space projectiles
    -   Fog of war, where you can only see as far as your farthest probe has gone
    -   Probes can build defense turrets on asteroids (can upgrade; fires once every 0.25s, upgrade means each shot has a 2%, 3%, or 4% chance of landing on incoming projectile)
    -   Probes that haven't landed on anything in 60s (of game time) automatically self destruct
        -   Say that probes double as asteroid miners (assume, for gameplay's sake, that resource pool is global)
    -   For solar system generation:
        -   Generates just 2 earth-like planets (where the players are)
            -   Each planet has 1 moon orbiting it
        -   Generates 0-5 other gas giants, each 2-5 times larger than the earth planets; gas giant has at least 2 moons orbiting it (max of 6)
    -   ANOTHER IDEA: Generate the solar system, then let the PLAYERS choose which planet they want to start on (players choose simultaneously; if they both start on the same planet, allow it and let hilarity ensue?)
        -   Players can start on an earth-like planet OR a moon
            -   So, you know the overall map right away, BUT scanners are still needed to find the enemy + to know which asteroids/moons are resource rich (only know what resources an asteroid has )
        -   Maybe have a mechanic where AFTER the players choose their starting locations, you assign resource amounts so that the farther away it is from either player, the more resources there are
            -   Make resources exhaustible except for the earth-like planets? (Means there's a trade-off between starting on earth)
    -   Base cannon mines some starting amount of resources, but scanners/miners are needed to generate more

## LATER IDEAS

-   Players start out not knowing which planet is their opponents (probably don't let players start on moons); they start out with no equipment, but are steadily gaining resources from mining (every second they gain X amount)
    -   To officially discover the opponent planet, players need to land a monitoring probe on it (even if they can see projectiles shooting out from radar range, and they CAN still win and kill an opponent before discovering them, the game will still list all planet details as unknown)
    -   Landing a probe on the planet tells you the name of the planet, if it's occupied, what technologies the planet has (so you can tell e.g. if just a probe is there, or unoccupied, or an enemy homeworld), and some filler lore text (e.g. planet name, type, mass, radius, day length, distance from sun, etc., so landing on unoccupied planets isn't boring)
-   Players start out being able to see all planets, but can only see projectiles/probes that come within radar range (by default, let's say within 200 units)
-   Players can build the following:
    -   Probes (launch them, they'll try to somewhat auto-aim at the nearest non-launch planet if they come within, say, 50 units; probes also have a radar range of 50 units around them, so they can let players pre-emptively see incoming projectiles + probes; probes can't/won't land on moons, let's say (so moons just absorb projectiles))
        -   If probes land on a NON enemy planet, then that planet becomes "colonized" and:
            1.  Slightly adds to the resources the player gets (say, each probe increases this by +25%, so 4 probed planets would double your resource gain)
            2.  The planet enters your radar (say, for 100 units around them, so somewhat more than the probe had while in transit)
        -   If an enemy has already colonized the planet, then they're notified your probe has landed, you're notified that the technology level of the planet includes `ACTIVE MINING PROBE DETECTED`, planet outlines in yellow, but you both keep mining and get resources
        -   If a probe lands on an enemy's home planet, it notifies you with a `RED ALERT` and highlights the planet in red; it does't generate any additional resources, and the probe is destroyed immediately upon landing (it's report is a "final transmission"). The enemy is notified that their home planet has been probed.
        -   ALSO, you need to land a probe on a planet in order to view its health (landing on an enemy planet still keeps the health revealed, even though the probe is technically "destroyed")
        -   If a probe can't find anything to land on within 60s, it self-destructs
    -   Weapons; once built, no ammo limit (unless otherwise stated), but have cooldowns between shots. 3 different weapon ideas:
        -   Swarm of small projectiles (say 25) fired in quick succession, moderate cooldown; 3 swarms entirely hitting would kill a planet
        -   1 large, fixed-speed, massive damage projectile (just 2 can kill a planet, can manually detonate (right click) for partial damage if there's a near-miss); long cooldown + you need to rebuild it each time (can only have 1 at a time - "due to the Geneva Protocol's OSHA regulations")
            -   Also, this is the only thing that can destroy other projectiles (projectiles caught in it's explosion count as having collided)
        -   Laser (moderate damage (~10 shots to kill a planet), shoots perfectly straight and ALMOST instantaneously (much faster than other options, but still has some travel time), relatively long cooldown)
        -   You can build all 3, each costs the same amount, and each will be on separate cooldowns, so you could use one while another's on cooldown; all weapons have a trajectory guider built-in
    -   Increase home planet's radar range (+100 each time, still takes build time)
    
-   Each building gets added to a build queue, and takes time to complete (buildings can be canceled before they finish and all the resources from it gotten back, but only 1 building can be under construction at a time)
-   Can kill non-resource planets (including your own) e.g. to take resources away from an enemy

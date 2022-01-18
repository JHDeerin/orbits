import Phaser from 'phaser'
import {GravityObject, RapidShot, LaserCannon, NukeLauncher, ProbeLauncher, PlanetType, Player} from './classes'
import {drawTrajectoryLine, getRandomItem, generatePlanets} from './utils'

const IS_DEBUG = false;

const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#282c34',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: IS_DEBUG
        }
    },
    scene: {
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);
function preload() {}

let planets;
let gravityObjects;
let player;

let graphics;
let resourceText;
let weaponText;
let weaponStatusText;

function create() {
    graphics = this.add.graphics();
    resourceText = this.add.text(16, 16);
    weaponText = this.add.text(16, 40);
    weaponStatusText = this.add.text(16, 64);

    planets = this.physics.add.group();
    gravityObjects = this.physics.add.group();

    const newPlanets = generatePlanets(this);
    for (let planet of newPlanets) {
        planets.add(planet);
    }
    const playerPlanet = getRandomItem(
        newPlanets.filter(p => p.type != PlanetType.Moon)
    );
    player = new Player(playerPlanet, 50, new RapidShot());
    weaponText.setText('Weapon: RapidShot');

    this.physics.add.collider(planets, gravityObjects,
        (planet, gravityObject) => {
            // TODO: Is this the most appropriate place for the collide handler?
            gravityObject.onCollision(planet);
            gravityObjects.remove(gravityObject);
            gravityObject.destroy();
            if (planet.mass <= 0) {
                planets.remove(planet);
                planet.destroy();
            }
        }
    );

    this.input.keyboard.on('keydown-ONE', () => {
        player.weapon = new RapidShot();
        weaponText.setText('Weapon: RapidShot');
    });
    this.input.keyboard.on('keydown-TWO', () => {
        player.weapon = new LaserCannon();
        weaponText.setText('Weapon: LaserCannon');
    });
    this.input.keyboard.on('keydown-THREE', () => {
        player.weapon = new NukeLauncher(undefined, undefined, undefined, planets, gravityObjects);
        weaponText.setText('Weapon: NukeLauncher');
    });
    this.input.keyboard.on('keydown-FOUR', () => {
        player.weapon = new ProbeLauncher(undefined, undefined, undefined, player);
        weaponText.setText('Weapon: ProbeLauncher');
    });

    function fireNewProjectile(pointer) {
        if (!pointer.leftButtonDown()) { return; }
        if (!player.planet || !player.planet.body) { return; }

        player.weapon.fire(this, gravityObjects, player.planet, player.shotSpeed);
    }
    this.input.on('pointerdown', fireNewProjectile, this);

    function adjustShotSpeed(pointer) {
        player.shotSpeed += pointer.deltaY * -0.1;
        player.shotSpeed = Math.min(Math.max(player.minShotSpeed, player.shotSpeed), player.maxShotSpeed);
        console.log(`Player shot speed: ${player.shotSpeed}`)
    }
    this.input.on('wheel', adjustShotSpeed, this);
    this.input.mouse.disableContextMenu();  // Disables menu on right-click

    console.log(planets);
    console.log(gravityObjects);
}

function update(timestep, dt) {
    function updatePositions() {
        const timeDiff = 1/60;
        // NOTE: GravityObjects are affected by planet gravity, but do NOT affect one another
        for (let gravityObj of gravityObjects.getChildren()) {
            gravityObj.updatePosition(planets.getChildren(), timeDiff);
        }
        for (let planet of planets.getChildren()) {
            planet.updatePosition();
        }
        for (let gravityObj of gravityObjects.getChildren()) {
            gravityObj.updateVelocity(planets.getChildren(), timeDiff);
        }
    }

    function updateScreen() {
        graphics.clear();
        GravityObject.clearTails();

        for (let obj of gravityObjects.getChildren()) {
            obj.drawObject();
        }
        for (let obj of planets.getChildren()) {
            obj.drawObject();
        }

        drawPlayerShotTrajectory();
        if (IS_DEBUG) {
            // Draw the trajectory of the 1st projectile, if it exists
            if (gravityObjects.getChildren()) {
                drawTrajectoryLine(this, graphics, gravityObjects.getChildren()[0], planets.getChildren(), 1000);
            }
        }

        resourceText.setText(`Resources: ${Math.round(player.resources)}`);
        const cooldownTimeLeft = Math.max(0,
            (player.weapon.cooldownSec - (new Date() - player.weapon.lastFiredTime) / 1000.0)
        );
        weaponStatusText.setText(`Weapon Status: ${
            player.weapon.onCooldown
            ? 'Cooldown (' + Math.ceil(10 * cooldownTimeLeft)/10.0 + 's left)'
            : 'Active'
        }`);
    }
    updateScreen = updateScreen.bind(this); // Binding needed to reference Phaser scene

    function drawPlayerShotTrajectory() {
        if (!player.planet) {
            return;
        }

        let trajectoryTracer = player.weapon.getShotGravityObject(this, player.planet, player.shotSpeed);
        drawTrajectoryLine(
            this,
            graphics,
            trajectoryTracer,
            planets.getChildren(),
            500,
            0.1,
            0xaaaaff,
            true
        );
        if (trajectoryTracer) {
            trajectoryTracer.destroy();
        }
    }
    drawPlayerShotTrajectory = drawPlayerShotTrajectory.bind(this); // Binding needed to reference Phaser scene

    player.addResources(dt/1000.0);

    updatePositions();
    updateScreen();
}

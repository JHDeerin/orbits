import Phaser from 'phaser'
import {GravityObject, RapidShot, LaserCannon, ProbeLauncher, PlanetType, Player} from './classes'
import {drawTrajectoryLine, getRandomItem, generatePlanets} from './utils'

const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#282c34',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: true
        }
    },
    scene: {
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);
function preload() {}

const IS_DEBUG = false;

let planets;
let gravityObjects;
let player;

let graphics;

function create() {
    graphics = this.add.graphics();

    planets = this.physics.add.group();
    gravityObjects = this.physics.add.group();

    const newPlanets = generatePlanets(this);
    for (let planet of newPlanets) {
        planets.add(planet);
    }
    const playerPlanet = getRandomItem(
        newPlanets.filter(p => p.type != PlanetType.Moon)
    );
    player = new Player(playerPlanet, 50, new ProbeLauncher());

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

function update() {
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

    updatePositions();
    updateScreen();
}

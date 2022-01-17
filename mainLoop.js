import Phaser from 'phaser'
import {GravityObject} from './classes'
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

let planets;
let gravityObjects;
let playerPlanet;

let graphics;

/**
 * Returns a gravity object that would be fired by the player shooting, based
 * on their mouse position
 */
function getShotGravityObject(scene, shotOriginPlanet, speed=50) {
    if (!shotOriginPlanet || !shotOriginPlanet.body) {
        return;
    }
    const mousePos = new Phaser.Math.Vector2(scene.input.x, scene.input.y);
    let shotDirection = mousePos.clone().subtract(shotOriginPlanet.body.center).normalize();

    return new GravityObject(
        scene,
        shotOriginPlanet.body.center.clone().add(
            shotDirection.clone().scale(shotOriginPlanet.radius + 2)),
        shotDirection.scale(speed),
        shotOriginPlanet.color
    );
}

function create() {
    graphics = this.add.graphics();

    planets = this.physics.add.group();
    gravityObjects = this.physics.add.group();

    const newPlanets = generatePlanets(this);
    for (let planet of newPlanets) {
        planets.add(planet);
    }
    playerPlanet = getRandomItem(newPlanets);

    // Create an example gravity object
    gravityObjects.add(new GravityObject(
        this,
        new Phaser.Math.Vector2(this.cameras.main.centerX, 200),
        new Phaser.Math.Vector2(50, 0),
        0xffaaaa
    ));

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
        if (!pointer.leftButtonDown()) {
            return;
        }
        if (!playerPlanet || !playerPlanet.body) {
            return;
        }

        gravityObjects.add(getShotGravityObject(this, playerPlanet));
    }
    this.input.on('pointerdown', fireNewProjectile, this);
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
        GravityObject.tailGraphics.clear();

        for (let obj of gravityObjects.getChildren()) {
            obj.drawObject();
        }

        drawPlayerShotTrajectory();
        drawTrajectoryLine(this, graphics, gravityObjects.getChildren()[0], planets.getChildren(), 1000);
    }
    updateScreen = updateScreen.bind(this); // Binding needed to reference Phaser scene

    function drawPlayerShotTrajectory() {
        if (!playerPlanet) {
            return;
        }

        let trajectoryTracer = getShotGravityObject(this, playerPlanet, 50);
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

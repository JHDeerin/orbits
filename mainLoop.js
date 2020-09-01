const Phaser = require('phaser')
const {GravityObject, Planet} = require('./classes')
const {isInsidePlanet} = require('./utils')

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

/**
 * Returns a list of procedurally-generated planets for the solar system
 *
 * @param {*} scene The Phaser scene the planets will be in
 */
function generatePlanets(scene) {
    // TODO: Actually implement this instead of hardcoding it?
    let generatedPlanets = [];
    generatedPlanets.push(new Planet(scene, 1e-5, 0xffff00, 50));
    generatedPlanets.push(new Planet(scene, 300, 0xea9999, 5));
    generatedPlanets.push(new Planet(scene, 200, 0xff00ff, 5));
    generatedPlanets.push(new Planet(scene, 400, 0xaaffaa, 5));
    generatedPlanets.push(new Planet(scene, 500, 0xf6b26b, 15));

    return generatedPlanets;
}

/**
 * Given a GravityObject, draws out the path that object will take for the
 * next "iterations" iterations
 *
 * TODO: CLEAN UP THIS DUMPSTER FIRE
 *
 * @param {*} scene The Phaser scene the object is in
 * @param {*} graphics The Phaser graphics object used to draw the path
 * @param {*} gravityObj The object you want to see the path for
 * @param {*} planets The gravity-affecting planets in the scene
 * @param {*} iterations How many iterations to calculate into the future
 * @param {*} updateInterval How long each interval takes (in seconds)
 * @param {*} lineColor The color to draw the path as
 * @param {*} isColliding If true, stop drawing the trajectory when it collides with an object
 */
function drawTrajectoryLine(
    scene,
    graphics,
    gravityObj,
    planets,
    iterations,
    updateInterval=0.5,
    lineColor=0xff0000,
    isColliding=false
) {
    let lines = [];
    // NOTE: GravityObjects ONLY used to draw trajectory; should not collide w/ anything
    if (!gravityObj) {
        return;
    }
    let objCopy = new GravityObject(
        scene,
        gravityObj.position,
        gravityObj.velocity,
        0x0,
        0
    );


    for (let i = 0; i < iterations; i++) {
        const currentPos = objCopy.position.clone();
        objCopy.updatePosition(planets, updateInterval);
        objCopy.updateVelocity(planets, updateInterval);
        lines.push(new Phaser.Geom.Line(
            currentPos.x, currentPos.y,
            objCopy.position.x, objCopy.position.y
        ));

        if (isColliding && isInsidePlanet(objCopy, planets)) {
            break;
        }
    }
    objCopy.destroy();

    for (let i = 0; i < lines.length; i++) {
        graphics.lineStyle(1, lineColor, 0.8 * (iterations-i)/iterations);
        graphics.strokeLineShape(lines[i]);
    }
}

function create() {
    graphics = this.add.graphics();

    planets = this.physics.add.group();
    gravityObjects = this.physics.add.group();

    const newPlanets = generatePlanets(this);
    for (let planet of newPlanets) {
        planets.add(planet);
    }
    playerPlanet = newPlanets[Math.floor(Math.random() * newPlanets.length)];

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

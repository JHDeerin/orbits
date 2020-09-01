import {Planet, GravityObject} from './classes.js'

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

function create() {
    graphics = this.add.graphics();

    planets = this.physics.add.group();
    gravityObjects = this.physics.add.group();

    planets.add(new Planet(this, 1e-5, 0xffff00, 50));
    planets.add(new Planet(this, 300, 0xff00ff, 5));
    planets.add(new Planet(this, 200, 0xff00ff, 5));
    playerPlanet = new Planet(this, 400, 0xaaffaa, 5);
    planets.add(playerPlanet);
    planets.add(new Planet(this, 500, 0xff00ff, 15));

    gravityObjects.add(new GravityObject(
        this,
        new Phaser.Math.Vector2(this.cameras.main.centerX, 200),
        new Phaser.Math.Vector2(50, 0),
        0xffaaaa
    ));

    this.physics.add.collider(planets, gravityObjects,
        (planet, gravityObject) => {
            gravityObject.onCollision(planet);
        }
    );

    function fireNewProjectile(pointer) {
        if (!pointer.leftButtonDown()) {
            return;
        }
        if (!playerPlanet) {
            return;
        }

        const mousePos = new Phaser.Math.Vector2(pointer.x, pointer.y);
        let shotDirection = mousePos.clone().subtract(playerPlanet.body.center).normalize();

        gravityObjects.add(new GravityObject(
            this,
            playerPlanet.body.center.clone().add(shotDirection.clone().scale(playerPlanet.radius + 2)),
            shotDirection.scale(50),
            0xaaffaa
        ));
    }

    this.input.on('pointerdown', fireNewProjectile, this);
    this.input.mouse.disableContextMenu();

    console.log(planets);
    console.log(gravityObjects);
}

function update() {
    function updatePositions() {
        const timeDiff = 1/60;
        for (let gravityObj of gravityObjects.getChildren()) {
            gravityObj.updatePosition(timeDiff);
        }
        for (let planet of planets.getChildren()) {
            planet.updatePosition();
        }
        for (let gravityObj of gravityObjects.getChildren()) {
            gravityObj.updateVelocity(timeDiff);
        }
    }

    function drawTrajectoryLine(gravityObj, iterations, updateInterval=0.5, lineColor=0xff0000, isStoppedByPlanets=false, ) {
        let lines = [];
        // NOTE: GravityObjects ONLY used to draw trajectory; should not collide w/ anything
        if (!gravityObj) {
            return;
        }
        let objCopy = new GravityObject(
            this,
            gravityObj.position,
            gravityObj.velocity,
            0x0,
            0
        );

        // TODO: How to do this natively via Phaser?
        function isInsidePlanet(gravityObj) {
            if (!isStoppedByPlanets) {
                return false;
            }

            for (let planet of planets.getChildren()) {
                if (gravityObj.body.center.distance(planet.body.center) < (planet.radius + gravityObj.radius)) {
                    return true;
                }
            }
            return false;
        }

        for (let i = 0; i < iterations; i++) {
            const currentPos = objCopy.position.clone();
            objCopy.updatePosition(updateInterval);
            objCopy.updateVelocity(updateInterval);
            lines.push(new Phaser.Geom.Line(
                currentPos.x, currentPos.y,
                objCopy.position.x, objCopy.position.y
            ));

            if (isInsidePlanet(objCopy)) {
                break;
            }
        }
        objCopy.destroy();

        for (let i = 0; i < lines.length; i++) {
            graphics.lineStyle(1, lineColor, 0.8 * (iterations-i)/iterations);
            graphics.strokeLineShape(lines[i]);
        }
    }
    drawTrajectoryLine = drawTrajectoryLine.bind(this);

    updatePositions();

    graphics.clear();

    for (let planet of planets.getChildren()) {
        planet.drawObject();
    }

    for (let obj of gravityObjects.getChildren()) {
        obj.drawObject();
    }

    function drawPlayerShotTrajectory() {
        if (!playerPlanet) {
            return;
        }

        const mousePos = new Phaser.Math.Vector2(game.input.mousePointer.x, game.input.mousePointer.y);
        let shotDirection = mousePos.clone().subtract(playerPlanet.body.center).normalize();
        let trajectoryTracer = new GravityObject(
                this,
                playerPlanet.body.center.clone().add(shotDirection.clone().scale(playerPlanet.radius + 2)),
                shotDirection.scale(50),
                0x0,
                0
        );
        drawTrajectoryLine(
            trajectoryTracer,
            500,
            0.1,
            0xaaaaff,
            true
        );
        trajectoryTracer.destroy();
    }
    drawPlayerShotTrajectory = drawPlayerShotTrajectory.bind(this);

    drawPlayerShotTrajectory();
    drawTrajectoryLine(gravityObjects.getChildren()[0], 1000);
}

export {graphics, planets, gravityObjects, playerPlanet};
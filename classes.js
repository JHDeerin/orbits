import Phaser from './mainLoop.js'

class Planet extends Phaser.GameObjects.Image {
    constructor(scene, distance, color, radius) {
        // Create planet "image" from graphics
        graphics.clear();
        graphics.fillStyle(color, 1);
        // TODO: Why does shifting this position affect the image??? Generate image from (0,0), maybe?
        graphics.fillCircle(radius, radius, radius);

        const spriteKey = `planet${planets.getLength()}`;
        graphics.generateTexture(spriteKey, 2*radius, 2*radius);

        let initialPosition = new Phaser.Math.Vector2();
        super(scene, initialPosition.x, initialPosition.y, spriteKey);
        scene.add.existing(this);

        this.t = 0;
        this.radius = radius;

        this.orbitDistance = distance;
        this.mass = radius**2;

        this.orbitPath = new Phaser.Curves.Path();
        this.orbitPath.add(new Phaser.Curves.Ellipse(
            scene.cameras.main.centerX,
            scene.cameras.main.centerY,
            distance
        ));

        scene.tweens.add({
            targets: this,
            t: 1,   // Increase until t hits 1, then loop
            duration: Math.ceil(this.calcOrbitDuration(distance)),
            repeat: -1
        });

        scene.physics.add.existing(this);
        this.body.setCircle(radius);
        this.body.setImmovable(true);   // Will only move by explicit update
    }

    calcOrbitDuration(distance) {
        // Assume 400 units away = 300s orbit
        //  Use Kepler's 3rd law to calculate expected duration
        const baseCircleArea = Math.PI * 400.0**2;
        const baseCircleTime = 300000;   // 300000ms, or 300s
        const currentOrbitArea = Math.PI * distance**2;

        return baseCircleTime * currentOrbitArea / baseCircleArea;
    }

    updatePosition() {
        let newPosition = new Phaser.Math.Vector2();
        this.orbitPath.getPoint(this.t, newPosition);
        this.body.reset(newPosition.x, newPosition.y);
    }

    drawObject() {}
}

// NOTE: Gravity objects are affected by gravity, but do NOT affect one another
class GravityObject extends Phaser.GameObjects.Image {
    constructor(scene, position, velocity, color, damage=10) {
        const radius = 1;
        // Draw image via graphics
        let tempGraphics = scene.add.graphics();
        tempGraphics.fillStyle(color, radius);
        // TODO: Why does shifting this position affect the image??? Generate image from (0,0), maybe?
        tempGraphics.fillCircle(radius, radius, radius);

        const spriteKey = `gravityObject${gravityObjects.getLength()}`;
        tempGraphics.generateTexture(spriteKey, 2*radius, 2*radius);
        tempGraphics.destroy();

        super(scene, position.x, position.y, spriteKey);
        scene.add.existing(this);

        scene.physics.add.existing(this);
        this.body.setCircle(radius);
        this.body.setImmovable(true);   // Will only move by explicit update

        // Body velocity only used to actually move object each frame
        this.position = position.clone();
        this.velocity = velocity.clone();
        this.color = color;
        this.prevPositionsQueue = [];
        this.accel = new Phaser.Math.Vector2();
        this.radius = radius;
        this.damage = damage;
    }

    drawObject() {
        // Cap length of trail
        if (this.prevPositionsQueue.length > 10) {
            this.prevPositionsQueue.shift();
        }

        // Draw trail behind it
        for (let i = this.prevPositionsQueue.length - 1; i > 0; i--) {
            const currentPos = this.prevPositionsQueue[i];
            const nextPos = this.prevPositionsQueue[i-1];
            graphics.lineStyle(
                1,
                this.color,
                0.8 * i/this.prevPositionsQueue.length);
            graphics.strokeLineShape(new Phaser.Geom.Line(
                currentPos.x, currentPos.y,
                nextPos.x, nextPos.y
            ));
        }
    }

    getGravityAccelVector(objectPos) {
        let accelVector = new Phaser.Math.Vector2();
        for (let planet of planets.getChildren()) {
            let toPlanet = planet.body.center.clone();
            toPlanet.subtract(objectPos);
            toPlanet.scale(planet.mass / toPlanet.length()**2);
            accelVector.add(toPlanet);
        }
        return accelVector;
    }

    updatePosition(timeDiff) {
        // Update position via Verlet integration
        let accelVector = this.getGravityAccelVector(this.position);
        let newPos = this.position.clone();
        newPos.add(this.velocity.clone().scale(timeDiff));
        newPos.add(accelVector.clone().scale(timeDiff**2 / 2.0));

        // Update position, save accel so we can update velocity later
        this.prevPositionsQueue.push(this.body.center.clone());
        this.position = newPos;
        this.accel = accelVector;

        this.body.reset(this.position.x, this.position.y);
    }

    updateVelocity(timeDiff) {
        let newAccelVector = this.getGravityAccelVector(this.position);
        let newVel = this.velocity.clone();
        newVel.add(this.accel.clone().scale(timeDiff / 2.0));
        newVel.add(newAccelVector.clone().scale(timeDiff / 2.0));

        this.velocity = newVel;
    }

    onCollision(planet) {
        console.log("COLLISION!!!");
        planet.mass -= this.damage;
        if (planet.mass <= 0) {
            planet.destroy();
        }
        gravityObjects.remove(this);
        this.destroy();
    }
}

export {
    Planet as default,
    GravityObject as default
};

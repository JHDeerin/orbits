import Phaser from 'phaser'
import {getUniqueID} from './utils'


export class PlanetType {
    /**
     * An enum of the different types of planets we can have (TODO: Would
     * inheritance be a better way to handle this?)
     */
    static Planet = new PlanetType("planet")
    static Sun = new PlanetType("sun")
    static Moon = new PlanetType("moon")

    constructor(name) {
        this.name = name;
    }
}

export class Planet extends Phaser.GameObjects.Image {
    /**
     * A circular planet that has a gravitational field and orbits around the "sun" on a fixed path
     *
     * @param {*} scene The Phaser scene the planet should be in
     * @param {*} distance The distance from the orbit center the planet should be; the farther away it is, the slower its orbit
     * @param {Number} color The hexadecimal color the planet should be
     * @param {*} radius The radius of the planet (in pixels); larger planets have more mass (i.e a greater gravitational effect)
     * @param {*} startingAngle The angle of rotation for the planet to start at on its orbit, from 0 to 360 (0 = 3 o'clock, rotates clockwise)
     * @param {*} centerPos The position the planet should orbit around (defaults to the center of the screen, i.e. the sun)
     * @param {PlanetType} type The type of planet this is
     */
    constructor(scene, distance, color, radius, startingAngle=0, centerPos=new Phaser.Math.Vector2(scene.cameras.main.centerX, scene.cameras.main.centerY), type=PlanetType.Planet) {
        // Create planet "image" from graphics
        let tempGraphics = scene.add.graphics();
        tempGraphics.clear();
        tempGraphics.fillStyle(color, 1);
        // TODO: Why does shifting this position affect the image??? Generate image from (0,0), maybe?
        tempGraphics.fillCircle(radius, radius, radius);

        const spriteKey = `planet${getUniqueID()}`;
        tempGraphics.generateTexture(spriteKey, 2*radius, 2*radius);
        tempGraphics.destroy();

        super(scene, centerPos.x, centerPos.y, spriteKey);
        scene.add.existing(this);

        this.t = 0;
        this.radius = radius;
        this.color = color;

        this.type = type;
        this.orbitDistance = distance;
        this.mass = radius**2;

        this.orbitPath = new Phaser.Curves.Path();
        this.orbitPath.add(new Phaser.Curves.Ellipse(
            scene.cameras.main.centerX,
            scene.cameras.main.centerY,
            distance
        ).setRotation(startingAngle));
        this.screenCenter = new Phaser.Math.Vector2(scene.cameras.main.centerX, scene.cameras.main.centerY);
        this.orbitCenter = centerPos;

        scene.tweens.add({
            targets: this,
            t: 1,   // Increase until t hits 1, then loop
            duration: Math.ceil(this.calcOrbitDuration(distance)),
            repeat: -1
        });

        scene.physics.add.existing(this);
        this.body.setCircle(radius);
        this.body.setImmovable(true);   // Will only move by explicit update

        if (type == PlanetType.Planet) {
            this.healthBar = new HealthBar(scene, this, this.mass, this.mass);
        }
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
        if (!this.orbitCenter) {
            // TODO: Make this fly off properly, instead of just awkwardly freezing
            return;
        }
        let newPosition = new Phaser.Math.Vector2();
        this.orbitPath.getPoint(this.t, newPosition);
        newPosition.add(this.orbitCenter).subtract(this.screenCenter);
        this.body.reset(newPosition.x, newPosition.y);
    }

    drawObject() {
        // Only need to draw the health bar, since the planet graphic itself
        // doesn't change
        if (!this.healthBar) { return; }
        this.healthBar.drawObject();
    }

    onCollision(damage) {
        if (this.type == PlanetType.Sun) { return; }
        this.mass -= damage;

        if (!this.healthBar) { return; }
        this.healthBar.decrease(damage);
    }

    destroy() {
        if (this.healthBar) {
            this.healthBar.destroy();
        }
        super.destroy();
    }
}

class HealthBar {
    constructor (scene, planet, health, maxHealth) {
        this.bar = new Phaser.GameObjects.Graphics(scene);
        this.value = health;
        this.maxValue = maxHealth;
        this.planet = planet;
        this.width = 50;
        this.height = 5;

        this.drawObject();
        scene.add.existing(this.bar);
    }

    decrease (amount) {
        this.value -= amount;
        this.value = Math.max(this.value, 0);
    }

    drawObject () {
        this.bar.clear();

        const planetPos = this.planet.body.position;
        // Center health bar above planet
        const barX = planetPos.x + this.planet.radius - this.width/2;
        const barY = planetPos.y - 10;
        //  Draw background
        this.bar.fillStyle(0x15171c);
        this.bar.fillRect(barX, barY, this.width, this.height);

        //  Draw health
        const healthPercent = this.value / this.maxValue;
        if (healthPercent < 0.3) {
            this.bar.fillStyle(0xff0000);
        } else {
            this.bar.fillStyle(0x00ff00);
        }
        this.bar.fillRect(barX, barY, this.width * healthPercent, this.height);
    }

    destroy() {
        this.bar.clear();
        this.bar.destroy();
    }
}

export class GravityObject extends Phaser.GameObjects.Image {
    /**
     * An object whose motion is affected by gravity in the scene
     *
     * @param {*} scene The Phaser scene the GravityObject should be in
     * @param {Phaser.Math.Vector2} position The starting position of the GravityObject
     * @param {Phaser.Math.Vector2} velocity
     * @param {Number} color The hexadecimal color the object should be
     * @param {*} damage How much damage the object inflicts when it hits something
     */
    constructor(scene, position, velocity, color, damage=10) {
        const radius = 1;
        // Draw image via graphics
        let tempGraphics = scene.add.graphics();
        tempGraphics.fillStyle(color, radius);
        // TODO: Why does shifting this position affect the image??? Generate image from (0,0), maybe?
        tempGraphics.fillCircle(radius, radius, radius);

        const spriteKey = `gravityObject${getUniqueID()}`;
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
        this.accel = new Phaser.Math.Vector2();

        this.color = color;
        this.prevPositionsQueue = [];
        this.radius = radius;
        this.damage = damage;

        // TODO: Avoid this singleton?
        // Holds the purely-graphical trails of all fired projectiles
        if (!GravityObject.tailGraphics) {
            GravityObject.tailGraphics = scene.add.graphics();
        }
    }

    drawObject(trailLength = 10) {
        // Cap length of trail
        if (this.prevPositionsQueue.length > trailLength) {
            this.prevPositionsQueue.shift();
        }

        // Draw trail behind it (TODO: Find more efficient way of doing this?)
        for (let i = this.prevPositionsQueue.length - 1; i > 0; i--) {
            const currentPos = this.prevPositionsQueue[i];
            const nextPos = this.prevPositionsQueue[i-1];
            GravityObject.tailGraphics.lineStyle(
                1,
                this.color,
                0.8 * i/this.prevPositionsQueue.length);
            GravityObject.tailGraphics.strokeLineShape(new Phaser.Geom.Line(
                currentPos.x, currentPos.y,
                nextPos.x, nextPos.y
            ));
        }
    }

    static clearTails() {
        if (!GravityObject.tailGraphics) { return; }
        GravityObject.tailGraphics.clear();
    }

    getGravityAccelVector(heavyObjects, objectPos) {
        let accelVector = new Phaser.Math.Vector2();
        for (let heavyObject of heavyObjects) {
            let toHeavy = heavyObject.body.center.clone();
            toHeavy.subtract(objectPos);
            toHeavy.scale(heavyObject.mass / toHeavy.length()**2);
            accelVector.add(toHeavy);
        }
        return accelVector;
    }

    updatePosition(heavyObjects, timeDiff) {
        // Update position via Verlet integration
        let accelVector = this.getGravityAccelVector(heavyObjects, this.position);
        let newPos = this.position.clone();
        newPos.add(this.velocity.clone().scale(timeDiff));
        newPos.add(accelVector.clone().scale(timeDiff**2 / 2.0));

        // Update position, save accel so we can update velocity later
        this.prevPositionsQueue.push(this.body.center.clone());
        this.position = newPos;
        this.accel = accelVector;

        this.body.reset(this.position.x, this.position.y);
    }

    updateVelocity(heavyObjects, timeDiff) {
        // Update velocity via Verlet integration (must be called AFTER all heavyObjects in the scene have finished moving)
        let newAccelVector = this.getGravityAccelVector(heavyObjects, this.position);
        let newVel = this.velocity.clone();
        newVel.add(this.accel.clone().scale(timeDiff / 2.0));
        newVel.add(newAccelVector.clone().scale(timeDiff / 2.0));

        this.velocity = newVel;
    }

    onCollision(planet) {
        console.log("COLLISION!!!");
        planet.onCollision(this.damage);
    }
}


class Weapon {
    constructor(cooldown=1.0, numShots=1, damage=10) {
        this.cooldownMs = cooldown;
        this.numShots = numShots;
        this.damage = damage;
        this.onCooldown = false;
    }

    async fire(scene, gravityObjects, shotOriginPlanet, speed=50) {}

    async startCooldown() {
        this.onCooldown = true;
        setTimeout(() => this.onCooldown = false, this.cooldownMs * 1000);
    }

    getShotDirection(scene, shotOriginPlanet) {
        const mousePos = new Phaser.Math.Vector2(scene.input.x, scene.input.y);
        let shotDirection = mousePos.clone().subtract(shotOriginPlanet.body.center).normalize();
        return shotDirection;
    }

    getShotOriginPos(shotOriginPlanet, shotDirection) {
        return shotOriginPlanet.body.center.clone().add(
            shotDirection.clone().scale(shotOriginPlanet.radius + 2));
    }

    /**
     * Returns a gravity object that would be fired by the player shooting, based
     * on their mouse position
     */
     getShotGravityObject(scene, shotOriginPlanet, speed=50) {
        return;
     }
}

export class RapidShot extends Weapon {
    constructor(cooldown=10.0, numShots=25, damage=10, shotInterval=0.1) {
        super(cooldown, numShots, damage);
        this.shotIntervalMs = shotInterval * 1000;
    }

    async fire(scene, gravityObjects, shotOriginPlanet, speed=50) {
        // TODO: Move cooldown logic to base class? Or avoid that for now?
        if (this.onCooldown) { return; }
        this.startCooldown();
        for (let i = 0; i < this.numShots; i++) {
            gravityObjects.add(this.getShotGravityObject(scene, shotOriginPlanet, speed));
            await new Promise(r => setTimeout(r, this.shotIntervalMs));
        }
    }

    getShotGravityObject(scene, shotOriginPlanet, speed=50) {
        if (!shotOriginPlanet || !shotOriginPlanet.body) { return; }

        let shotDirection = this.getShotDirection(scene, shotOriginPlanet);
        return new GravityObject(
            scene,
            this.getShotOriginPos(shotOriginPlanet, shotDirection),
            shotDirection.scale(speed),
            shotOriginPlanet.color
        );
    }
}

class LaserShot extends GravityObject {
    /**
     * A laser projectile  that isn't affected by gravity
     */

    getGravityAccelVector(heavyObjects, objectPos) {
        let accelVector = new Phaser.Math.Vector2(0.0, 0.0);
        return accelVector;
    }

    drawObject(trailLength = 10) {
        super.drawObject(trailLength=50);
    }
}

export class LaserCannon extends Weapon {
    constructor(cooldown=10.0, numShots=1, damage=25, speed=500) {
        super(cooldown, numShots, damage);
        this.speed = speed;
    }

    async fire(scene, gravityObjects, shotOriginPlanet, speed=50) {
        // TODO: Move cooldown logic to base class? Or avoid that for now?
        if (this.onCooldown) { return; }
        this.startCooldown();

        speed = this.speed;
        gravityObjects.add(this.getShotGravityObject(scene, shotOriginPlanet, speed));
    }

    /**
     * Returns a laser object that isn't affected by gravity
     */
     getShotGravityObject(scene, shotOriginPlanet, speed) {
        if (!shotOriginPlanet || !shotOriginPlanet.body) { return; }

        let shotDirection = this.getShotDirection(scene, shotOriginPlanet);
        return new LaserShot(
            scene,
            this.getShotOriginPos(shotOriginPlanet, shotDirection),
            shotDirection.scale(speed),
            shotOriginPlanet.color
        );
    }
}

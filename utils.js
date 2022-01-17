import Phaser from 'phaser'
import {GravityObject, Planet, PlanetType} from './classes'

/**
 * Generates a unique ID string
 */
export function getUniqueID(startingString='') {
    // Store cache on function itself to keep state
    if (!getUniqueID.lastNum) {
        getUniqueID.lastNum = 0;
    }
    getUniqueID.lastNum += 1;
    return `${startingString}${getUniqueID.lastNum}`;
}

/**
 * Returns a random item from the given array
 */
export function getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * Returns a random number between the given range (inclusive on both ends)
 */
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Returns a list of procedurally-generated planets for the solar system
 *
 * @param {*} scene The Phaser scene the planets will be in
 */
export function generatePlanets(scene) {
    let generatedPlanets = [];
    const SUN_SIZE = 50;
    const ROCKY_PLANET_SIZES = {min: 5, max: 8};
    const MOON_SIZES = {min: 2, max: 4};
    const GAS_GIANT_SIZES = {min: 12, max: 20};

    const ROCKY_PLANET_COLORS = [0xfbf6bf, 0xbec2a9, 0x94897d, 0x66575b, 0x393c47, 0x78a4d6]
    const GAS_GIANT_COLORS = [0xdcdfe4, 0xd8c4a8, 0xbd6428, 0xa57567];

    // Create the sun
    generatedPlanets.push(new Planet(scene, 1e-5, 0xffff00, SUN_SIZE, undefined, undefined, PlanetType.Sun));

    const numRockyPlanets = getRandomInt(2, 4);
    const numGasGiants = getRandomInt(3, 6);
    for (let i = 0; i < numRockyPlanets + numGasGiants; i++) {
        // Generate planets progressively farther from center; rocky planets
        // closer than gas giants
        const extraDist = getRandomInt(25, 125);
        const previousDist = generatedPlanets[i].orbitDistance;
        const previousSize = generatedPlanets[i].radius;

        //  TODO: Let there be a chance some gas giants are closer than rocky?
        if (i < numRockyPlanets) {
            const size = getRandomInt(ROCKY_PLANET_SIZES.min, ROCKY_PLANET_SIZES.max);
            generatedPlanets.push(new Planet(
                scene,
                previousDist + extraDist + previousSize + size,
                getRandomItem(ROCKY_PLANET_COLORS),
                size,
                getRandomInt(0, 360)));
        } else {
            const size = getRandomInt(GAS_GIANT_SIZES.min, GAS_GIANT_SIZES.max);
            generatedPlanets.push(new Planet(
                scene,
                previousDist + extraDist + previousSize + size,
                getRandomItem(GAS_GIANT_COLORS),
                size,
                getRandomInt(0, 360)));
        }
    }

    // Create moons around each planet
    const MOON_PROBABILITY = 0.2;
    const NUM_MOON_PER_PLANET = {min: 1, max:3}
    for (let i = 0; i < numRockyPlanets + numGasGiants; i++) {
        const givePlanetMoon = Math.random() < MOON_PROBABILITY;
        const tooCloseToSun = generatedPlanets[i].orbitDistance < 5 + SUN_SIZE;
        if (!givePlanetMoon || tooCloseToSun) {
            continue;
        }

        const numMoons = getRandomInt(NUM_MOON_PER_PLANET.min, NUM_MOON_PER_PLANET.max);
        const moonDistance = getRandomInt(5, 15);
        const planetSize = generatedPlanets[i].radius;
        for (let j = 0; j < numMoons; j++) {
            const moonSize = getRandomInt(MOON_SIZES.min, MOON_SIZES.max);
            generatedPlanets.push(new Planet(
                scene,
                moonDistance + planetSize + moonSize,
                getRandomItem(ROCKY_PLANET_COLORS),
                moonSize,
                j*360/numMoons,
                generatedPlanets[i].body.center,
                PlanetType.Moon));
        }
    }

    return generatedPlanets;
}

/**
 * Returns true if the given gravityObject is inside one of the planets, false
 * otherwise
 * TODO: How to do this natively via Phaser?
 *
 * @param {*} gravityObj GravityObject to check the position of
 * @param {*} planets An array of circular planets to check
 */
function isInsidePlanet(gravityObj, planets) {
    for (let planet of planets) {
        if (gravityObj.body.center.distance(planet.body.center) < (planet.radius + gravityObj.radius)) {
            return true;
        }
    }
    return false;
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
export function drawTrajectoryLine(
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
    // Need to do a deep copy to avoid changing the actual object's positio;
    // calls the actual constructor so we'll match the behavior of any subclass
    // of GravityObject
    let objCopy = new gravityObj.constructor(
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

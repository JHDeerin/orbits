import {GravityObject, Planet} from './classes.js'

/**
 * Generates a unique ID string
 */
function getUniqueID(startingString='') {
    // Store cache on function itself to keep state
    if (!getUniqueID.lastNum) {
        getUniqueID.lastNum = 0;
    }
    getUniqueID.lastNum += 1;
    return `${startingString}${getUniqueID.lastNum}`;
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

export {
    drawTrajectoryLine,
    generatePlanets,
    getUniqueID
};

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

exports.isInsidePlanet = isInsidePlanet
exports.getUniqueID = getUniqueID

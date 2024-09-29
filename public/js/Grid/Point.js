import Float from "./Float.js"

export default class Point {
    constructor(x, y) {
        this.x = parseFloat(x);
        this.y = parseFloat(y);
        if (isNaN(this.x) || isNaN(this.y)) {
            console.error('x and y must be numbers. Received x: ' + x + ' y: ' + y)
            throw new Error('x and y must be numbers')
        }
    }

    /**
     * Clamp x and y between the min and max values.
     *
     * @param {number} minX
     * @param {number} maxX
     * @param {number} minY
     * @param {number} maxY
     * @returns {Point} returns itself for method chaining.
     */
    clamp(minX, maxX, minY, maxY) {
        this.x = Float.clamp(this.x, minX, maxX)
        this.y = Float.clamp(this.y, minY, maxY)
        return this
    }

    /**
     * Rotate the point around 0,0 or a given 'centre' point.
     *
     * @param {number} degrees
     * @param {Point} centre if provided rotates around this point instead of 0,0
     * @returns {Point} returns itself for method chaining.
     */
    rotate(degrees, centre = new Point(0,0)) {
        const mouseX = this.x - centre.x
        const mouseY = this.y - centre.y

        const angleRadians = degrees * (Math.PI / 180);
        const cosAngle = Math.cos(-angleRadians);
        const sinAngle = Math.sin(-angleRadians);

        const rotatedX = mouseX * cosAngle - mouseY * sinAngle;
        const rotatedY = mouseX * sinAngle + mouseY * cosAngle;

        this.x = rotatedX + centre.x
        this.y = rotatedY + centre.y
        return this
    }

    /**
     * Calculate the angle of the point as if it was the end of a clock hand and centre of the clock is 0,0.
     * 12 O'clock / up representing 0 degrees.
     * 3 O'clock / down representing 90 degrees etc.
     *
     * @returns {number}
     */
    angle() {
        // Atan operates in the range of -180 to 180deg with up being 0deg and returns the result in radians.
        let radians = Math.atan2(this.y, this.x);
        let degrees = radians * (180 / Math.PI);
        degrees = (degrees < 0) ? degrees + 360 : degrees;
        // Adjust the angle to be relevant to the orientation of CSS (Atan uses X axis as 0deg and CSS uses Y axis as 0deg).
        return (degrees + 90) % 360;
    }
}

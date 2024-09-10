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
     * @returns {Point}
     */
    clamp(minX, maxX, minY, maxY) {
        this.x = Float.clamp(this.x, minX, maxX)
        this.y = Float.clamp(this.y, minY, maxY)
        return this
    }

    /**
     * Rotate the point.
     *
     * @param {number} degrees
     * @param {Point} centre if provided rotates around this point instead of 0,0
     * @returns {Point} returns itself for method chaining.
     */
    rotate(degrees, centre = null) {
        if (!centre instanceof Point) {
            centre = new Point(0,0)
        }

        const x = this.x - centre.x
        const y = this.y - centre.y

        const angleRadians = degrees * (Math.PI / 180);
        const cosAngle = Math.cos(-angleRadians);
        const sinAngle = Math.sin(-angleRadians);

        const rotatedX = x * cosAngle - y * sinAngle;
        const rotatedY = x * sinAngle + y * cosAngle;

        const clickAngle = Math.atan2(rotatedY, rotatedX) * (180 / Math.PI)

        this.x = rotatedX + centre.x
        this.y = rotatedY + centre.y

        return this
    }
}

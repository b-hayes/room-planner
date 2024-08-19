import Float from "./Float.js"

export default class Vector {
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
     */
    clamp(minX, maxX, minY, maxY) {
        this.x = Float.clamp(this.x, minX, maxX)
        this.y = Float.clamp(this.y, minY, maxY)
        return this
    }
}

export default class Vector {
    constructor(x, y) {
        this.x = parseFloat(x);
        this.y = parseFloat(y);
        if (isNaN(this.x) || isNaN(this.y)) {
            throw new Error('x and y must be numbers')
        }
    }

    /**
     * Clamp x and y between the min and max values.
     */
    clamp(minX, maxX, minY, maxY) {
        this.x = this.clampNumber(this.x, minX, maxX)
        this.y = this.clampNumber(this.y, minY, maxY)
        return this
    }

    scale(scalar) {
        this.x *= scalar
        this.y *= scalar
        return this
    }

    clampNumber(num, a, b){
        return Math.max(Math.min(num, Math.max(a, b)), Math.min(a, b))
    }
}

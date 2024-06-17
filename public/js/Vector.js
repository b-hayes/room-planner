export default class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    /**
     * Clamp x and y between the min and max values.
     */
    clamp(minX, maxX, minY, maxY) {
        this.x = this.clampNumber(this.x, minX, maxX)
        this.y = this.clampNumber(this.y, minY, maxY)
    }

    clampNumber(num, a, b){
        return Math.max(Math.min(num, Math.max(a, b)), Math.min(a, b))
    }
}

export default class Float {

    static parse(n, message = 'n must be a number') {
        n = parseFloat(n)
        if (isNaN(n)) {
            throw new Error(message)
        }
        return n
    }

    static round(n, nearest) {
        n = this.parse(n)
        nearest = this.parse(nearest, 'nearest must be a number')
        const scale = 1 / nearest
        const roundedScaledValue = Math.round(n * scale)
        return roundedScaledValue / scale;
    }

    static clamp(n, min, max){
        n = this.parse(n)
        min = this.parse(min, 'min must be a number')
        max = this.parse(max, 'max must be a number')
        return Math.max(Math.min(n, Math.max(min, max)), Math.min(min,max))
    }
}
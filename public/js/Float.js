export default class Float {
    static round(n, nearest) {
        n = this.parse(n)
        const scale = 1 / nearest
        const roundedScaledValue = Math.round(n * scale)
        return roundedScaledValue / scale;
    }

    static clamp(n, min, max){
        n = this.parse(n)
        return Math.max(Math.min(n, Math.max(min, max)), Math.min(min,max))
    }

    static parse(n) {
        n = parseFloat(n)
        if (isNaN(n)) {
            throw new Error('n must be a number')
        }
        return n
    }
}
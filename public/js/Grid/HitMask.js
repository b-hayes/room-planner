// Alpha map of an image, so clicks can pass through its transparent areas.
export default class HitMask {
    static size = 256
    static minAlpha = 30
    static masks = new Map()

    static of(image) {
        if (!HitMask.masks.has(image)) {
            HitMask.masks.set(image, new HitMask(image))
        }
        return HitMask.masks.get(image)
    }

    alpha = null

    constructor(image) {
        const size = HitMask.size
        const img = new Image()
        img.onload = () => {
            const canvas = document.createElement('canvas')
            canvas.width = size
            canvas.height = size
            const context = canvas.getContext('2d', {willReadFrequently: true})
            context.drawImage(img, 0, 0, size, size)
            this.alpha = context.getImageData(0, 0, size, size).data
        }
        img.src = image
    }

    // u and v go 0 to 1 across the image; reach widens the hit area for thin lines
    isOpaqueNear(u, v, reachU, reachV) {
        if (!this.alpha) {
            return true
        }
        const offsets = [-1, 0, 1]
        return offsets.some(du => offsets.some(dv => this.isOpaqueAt(u + du * reachU, v + dv * reachV)))
    }

    isOpaqueAt(u, v) {
        if (u < 0 || u > 1 || v < 0 || v > 1) {
            return false
        }
        const size = HitMask.size
        const x = Math.min(size - 1, Math.floor(u * size))
        const y = Math.min(size - 1, Math.floor(v * size))
        return this.alpha[(y * size + x) * 4 + 3] >= HitMask.minAlpha
    }
}

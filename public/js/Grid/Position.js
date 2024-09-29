import Float from "./Float.js"

export default class Position {
    constructor(x = 0, y = 0, width = 0, height = 0, rotation = 0)
    {
        this.x = Float.parse(x)
        this.y = Float.parse(y)
        this.width = Float.parse(width)
        this.height = Float.parse(height)
        this.rotation = Float.parse(rotation)
    }
}
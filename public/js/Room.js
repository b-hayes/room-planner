import Shape from "./Grid/Shape.js"
import Loader from "./ModuLatte/Loader.js"
import Text from "./ModuLatte/Text.js"
import Position from "./Grid/Position.js"

export default class Room extends Shape {

    static wallThickness = 10

    constructor(
        id = Text.randomId(),
        position = new Position (
            200,
            200,
            300,
            300,
            0
        ),
        scale = 1,
        backgroundImage = ''
    ) {
        super(id, position, scale, backgroundImage)
        this.element().classList.add('room')
    }

    redraw() {
        super.redraw()
        this.element().style.outlineWidth = `${Room.wallThickness * this.scale}px`
    }

    mouseDown(e) {
        super.mouseDown(e)
        this.carriedShapes = this.shapesMostlyInside()
            .map(shape => ({shape, positionWhenClicked: shape.position}))
    }

    drag(mouseMoveEvent, initialMouseDownEvent) {
        super.drag(mouseMoveEvent, initialMouseDownEvent)
        if (this.resizing !== false || this.rotating) {
            return
        }
        const shiftX = this.position.x - this.shapePositionWhenClicked.x
        const shiftY = this.position.y - this.shapePositionWhenClicked.y
        this.carriedShapes.forEach(({shape, positionWhenClicked}) => {
            const {x, y, width, height, rotation} = positionWhenClicked
            shape.position = new Position(x + shiftX, y + shiftY, width, height, rotation)
        })
    }

    shapesMostlyInside() {
        const room = this.bounds()
        return [...this.element().parentElement.children]
            .map(element => element.componentInstance)
            .filter(shape => shape instanceof Shape && !(shape instanceof Room))
            .filter(shape => {
                const box = shape.bounds()
                const overlapWidth = Math.max(0, Math.min(box.right, room.right) - Math.max(box.left, room.left))
                const overlapHeight = Math.max(0, Math.min(box.bottom, room.bottom) - Math.max(box.top, room.top))
                const area = (box.right - box.left) * (box.bottom - box.top)
                return overlapWidth * overlapHeight > area / 2
            })
    }

    style() {
        return super.style() + style;
    }
}

// language=CSS
const style = `
    .room.shape {
        z-index: 90; /* behind regular shapes */
        background-color: var(--default-room-color, rgba(211, 211, 211, 0.7));
        color: black;
        /* inner shadow */
        box-shadow: inset 0 0 10px 0 rgba(0, 0, 0, 0.5);
        border: none;
        outline: solid black;
    }

    .room.shape:hover {
        border: none;
    }

    .room.shape.selected {
        color: var(--foreground, black);
        border: none;
        outline-color: var(--link-hover, darkseagreen);
    }
`

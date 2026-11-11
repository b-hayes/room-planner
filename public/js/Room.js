import Shape from "./Grid/Shape.js"
import Text from "./ModuLatte/Text.js"
import Position from "./Grid/Position.js"

export default class Room extends Shape {

    static wallThickness = 10

    isRoom = true

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

    .room.shape.drop-target {
        outline-color: hotpink;
    }

    .room.shape.selected {
        color: var(--foreground, black);
        border: none;
        outline-color: var(--link-hover, darkseagreen);
    }
`

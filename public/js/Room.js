import Shape from "./Grid/Shape.js"
import Loader from "./ModuLatte/Loader.js"
import Text from "./ModuLatte/Text.js"
import Position from "./Grid/Position.js"

export default class Room extends Shape {

    constructor(
        id = Text.randomId(),
        position = new Position (
            150,
            150,
            300,
            300,
            0
        )
    ) {
        super(id, position)
        this.element().classList.add('room')
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
        border: 3px solid black
    }

    .room.shape.selected {
        color: var(--foreground, black);
        border: 3px solid var(--link-hover, darkseagreen);
    }
`

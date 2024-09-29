import Shape from "./Grid/Shape.js"
import Loader from "./ModuLatte/Loader.js"

export default class Room extends Shape {

    constructor(
        id = Loader.randomId(),
        position = {
            width: 300,
            height: 300,
            x: undefined, //if undefined will center
            y: undefined, //if undefined will center
            rotation: 0
        }
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

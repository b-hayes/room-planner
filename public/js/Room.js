import Shape from "./Shape.js"

export default class Room extends Shape {

    constructor(
        id,
        parent = document.body,
        position = {
            width: 300,
            height: 300,
            x: undefined, //if undefined will center
            y: undefined, //if undefined will center
        }
    ) {
        super(id, parent, position)
        this.element().classList.add('room')
    }

    style() {
        return style;
    }
}

// language=CSS
const style = `
    .room.shape {
        z-index: 90; /* behind regular shapes */
        background-color: lightgrey;
        color: black;
        /* inner shadow */
        box-shadow: inset 0 0 10px 0 rgba(0, 0, 0, 0.5);
        border: 3px solid black
    }
`
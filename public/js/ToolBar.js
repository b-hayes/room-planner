import Shape from "./Shape.js";

// language=CSS
const style = `
.toolbar.shape {
    background-color: #fff;
    border: 1px solid #000;
    position: absolute;
    z-index: 100;
}`

export default class ToolBar extends Shape {
    constructor(
        width = 100,
        height = 400,
        colour = 'darkgrey',
        parent = undefined, //if undefined will attach to nearest grid || document.body
        x = 0,
        y = 0,
    ) {
        super(width, height, colour, parent, x, y)
        console.log('toolbar element', this.element)
        this.element.classList.add('toolbar')
    }
}
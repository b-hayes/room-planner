import Shape from "./Shape.js";

// language=HTML
const html = `
    <div class="toolbar">
        <button class="toolbar-button">Button 1</button>
        <button class="toolbar-button">Button 2</button>
        <div class="toolbar-separator"></div>
        <button class="toolbar-button active">Button 3</button>
        <button class="toolbar-button">Button 4</button>
    </div>
`

// language=CSS
const style = `
    /* Toolbar Container */
    .toolbar {
        z-index: 100;
        display: flex;
        background-color: #2d2d2d;
        padding: 10px;
        border-bottom: 1px solid #444;
    }

    /* Toolbar Button */
    .toolbar-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        padding: 8px;
        margin-right: 8px;
        border: none;
        background-color: #333;
        color: #fff;
        font-size: 14px;
        font-weight: bold;
        border-radius: 4px;
        transition: background-color 0.3s ease;
    }

    .toolbar-button:hover {
        background-color: #555;
    }

    /* Separator between buttons */
    .toolbar-separator {
        width: 1px;
        height: 20px;
        margin: 0 10px;
        background-color: #444;
    }

    /* Active state for buttons */
    .toolbar-button.active {
        background-color: #4CAF50;
        color: #fff;
    }
`



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

    loadStyles() {
        super.loadStyles(style, 'toolbar')
    }

    loadHtml(html) {
            super.loadHtml()
    }
}

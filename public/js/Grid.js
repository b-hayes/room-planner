import Component from "./Scafold/Component.js"

export default class Grid extends Component {

    constructor({scale = 1}) {
        super()
        this.scale = scale
    }

    html() {
        return html
    }

    style() {
        return style
    }
}

// language=HTML
const html = `
    <div class="grid">
        <div class="grid-background">
            <slot></slot>
        </div>
    </div>
`

// language=CSS
const style = `
    .grid {
        position: fixed;
        height: 100%;
        width: 90vw;
        margin: 0;
        left: 10vw;
        top: 0;
        overflow: hidden;
        box-shadow: inset 5px 5px 10px 3px rgba(0, 0, 0, 0.5);
    }
    .grid-background {
        background-image: repeating-linear-gradient(var(--foreground) 0 1px, transparent 1px 100%),
        repeating-linear-gradient(90deg, var(--foreground) 0 1px, transparent 1px 100%);
        background-size: 100px 100px;
        width: 100%;
        height: 100%;
        opacity: 0.5;
    }
`
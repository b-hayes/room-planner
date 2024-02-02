import Component from "./Scafold/Component.js"

export default class Grid extends Component {

    constructor({scale = 1}) {
        super()
        this.scale = scale

        //apply scale changes when scrolling
        window.addEventListener('wheel', (e) => {
            //if scrolling is not happening on the grid, ignore it
            if (!this.element().contains(e.target)) {
                return
            }

            e.preventDefault()
            this.scale += e.deltaY * -0.001
            this.scale = Math.max(0.001, Math.min(10, this.scale))
            //this.element().style.transform = `scale(${this.scale})`

            // Snap scale change to the nearest 0.001
            this.scale = Math.round(this.scale * 10000) / 10000;

            //update scale tooltip
            this.element().getElementsByClassName('tool-tip')[0].innerText = `Scale: 1px = ${this.scale}m`
        })
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
            <div class="tool-tip">Scale: 1px = .01m</div>
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

    .grid-background .tool-tip {
        position: absolute;
        top: 0;
        left: 0;
        color: white;
        background-color: var(--foreground, black);
        opacity: 0.8;
        padding: 5px;
        font-size: 1.5em;
        z-index: 100;
    }
`

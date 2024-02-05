import Component from "./Scafold/Component.js"

export default class Grid extends Component {

    constructor({scale = 1}) {
        super()
        this.scale = scale

        //apply scale changes when scrolling
        document.addEventListener('wheel', (e) => this.scroll(e), false)
    }

    scroll(e) {
            //if ctrl or command is not held, ignore
            if (!e.ctrlKey && !e.metaKey) return

            //if scrolling is not happening on the grid, ignore it
            if (!this.element().contains(e.target)) {
                return
            }

            let maxScale = 5
            let minScale = 0.25
            //if attempting to scroll over the max or below the min scale, ignore it
            let toolTip = this.element().getElementsByClassName('tool-tip')[0]
            if (this.scale + e.deltaY * -0.001 > maxScale || this.scale + e.deltaY * -0.001 < minScale) {
                //make the tooltip flash red to indicate the scale is at its limit
                //get the original color,  if not already red
                if (toolTip.style.color !== 'red') {
                    var originalColor = toolTip.style.color
                }

                toolTip.style.color = 'red'
                setTimeout(() => {
                        toolTip.style.color = originalColor
                    }
                    , 100)
                return
            }

            e.preventDefault()
            this.scale += e.deltaY * -0.001
            this.scale = Math.max(minScale, Math.min(maxScale, this.scale))

            // Snap scale change to the nearest 0.001
            this.scale = Math.round(this.scale * 10000) / 10000;

            //update scale tooltip
            toolTip.innerText = `Scale: 1px = ${this.scale}cm`


            //update grid background css to show the grid size change
            this.element().getElementsByClassName('grid-background')[0].style.backgroundSize = `${100 * this.scale}px ${100 * this.scale}px`

            //trigger a custom event so the other objects can react to the scale change.
            let event = new CustomEvent('grid-scale-changed', {
                detail: {
                    button: e.button,
                    x: e.pageX,
                    y: e.pageY,
                    object: this
                }
            })
            this.dispatchEventWithDebounce(event, 0)
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
            <div class="tool-tip">Scale: 1px = 1cm</div>
            <slot></slot>
        </div>
    </div>
`

// language=CSS
const style = `
    .grid {
        user-select: none;
        position: relative;
        overflow: scroll;
        min-height: 100%;
        min-width: 100%;
        box-shadow: inset 5px 5px 10px 3px rgba(0, 0, 0, 0.5);
    }

    .grid-background {
        background-image: repeating-linear-gradient(var(--foreground) 0 1px, transparent 1px 100%),
        repeating-linear-gradient(90deg, var(--foreground) 0 1px, transparent 1px 100%);
        background-size: 100px 100px;
        /* absolut with all zeros stretches to fill the scrollable space not just the size of the parent container */
        position: absolute;
        left: 0;
        top: 0;
        right: 0;
        bottom: 0;
        opacity: 0.5;
    }

    .tool-tip {
        position: absolute;
        top: 0;
        left: 0;
        color: var(--foreground, black);
        /*background-color: var(--background, white);*/
        /*opacity: 0.8;*/
        padding: 5px;
        font-size: 16px;
        z-index: 100;
    }
`

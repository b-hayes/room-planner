import Component from "./Scafold/Component.js"

export default class Grid extends Component {

    constructor({scale = 1}) {
        super()
        this.scale = scale
        this.background = this.element().getElementsByClassName('grid-background')[0]
        this.toolTip = this.element().getElementsByClassName('tool-tip')[0]

        document.addEventListener('wheel', (e) => this.scroll(e), false)
    }

    scroll(e) {
        //if ctrl or command is held, then scroll to zoom
        if (!(!e.ctrlKey && !e.metaKey)) {
            if (this.element().contains(e.target)) {
                let maxScale = 5
                let minScale = 0.25
                let toolTip = this.toolTip
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
                this.scale = Math.round(this.scale * 10000) / 10000;
                toolTip.innerText = `Scale: 1px = ${this.scale}cm`
                this.background.style.backgroundSize = `${100 * this.scale}px ${100 * this.scale}px`
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
        }

        //update the size of the background to match the scrollable space in the grid
        this.element().getElementsByClassName('grid-background')[0].style.width = this.element().scrollWidth + 'px'
        this.element().getElementsByClassName('grid-background')[0].style.height = this.element().scrollHeight + 'px'

        //update the position of the tool tip so it stays in the top left corner
        this.toolTip.style.top = this.element().scrollTop + 'px'
        this.toolTip.style.left = this.element().scrollLeft + 'px'
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
        min-height: 100%;
        min-width: 100%;
        box-shadow: inset 5px 5px 10px 3px rgba(0, 0, 0, 0.5);
        
        /* Simply allowing scroll bars instead of manually controlling the "view" coz easier and it works */
        overflow: scroll;
        scrollbar-width: thin;
        scrollbar-color: var(--foreground) var(--background);
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

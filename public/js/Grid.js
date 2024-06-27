import Component from "./Scafold/Component.js"
import Vector from "./Vector.js"

export default class Grid extends Component {

    scale = 1

    constructor({scale = 1}) {
        super()
        this.scale = scale
        this.background = this.element() //the background is the element now.
        this.toolTip = this.element().getElementsByClassName('tool-tip')[0]
        document.addEventListener('mousedown', (e) => this.mouseDown(e), false)

        // determine the initial zoom level of the client browser so we can reset it to counter Chromes bug of not being able to prevent zoom on the first ctrl+scroll event.
        // this.initialZoom = window.devicePixelRatio || (screen.logicalXDPI / screen.deviceXDPI);
        document.addEventListener('wheel', (e) => this.scroll(e), {passive: false})

        window.addEventListener('keydown', function (event) {
            if ((event.ctrlKey === true) || (event.ctrlKey === true)) {
                event.preventDefault();
            }
        }, {passive: false});

        window.addEventListener('wheel', function (event) {
            if (event.ctrlKey === true) {
                event.preventDefault();
            }
        }, {passive: false});
    }

    mouseDown(e) {
        if (e.target !== this.element() && !this.element().contains(e.target)) {
            return
        }

        // record click position and scroll position
        this.positionWhenClicked = {
            scrollX: this.element().scrollLeft,
            scrollY: this.element().scrollTop,
            clickX: e.pageX,
            clickY: e.pageY
        }

        document.addEventListener('mousemove', (e) => this.drag(e), false)
        document.addEventListener('mouseup', () => this.mouseUp(), false)
    }

    mouseUp() {
        this.positionWhenClicked = null
        document.removeEventListener('mousemove', (e) => this.drag(e), false)
        document.removeEventListener('mouseup', () => this.mouseUp(), false)
    }

    drag(e) {
        //if the mouse not held were not dragging
        if (!e.buttons) {
            return
        }

        let shift = new Vector(
            this.positionWhenClicked.clickX - e.pageX,
            this.positionWhenClicked.clickY - e.pageY
        )

        // Pan if the alt key is held, or middle mouse button is held
        if (e.altKey || e.buttons === 4) {
            let scroll = new Vector(
                this.positionWhenClicked.scrollX + shift.x,
                this.positionWhenClicked.scrollY + shift.y
            )
            //prevent numbers out of range
            scroll.clamp(
                0,
                this.element().scrollWidth - this.element().clientWidth,
                0,
                this.element().scrollHeight - this.element().clientHeight
            )

            //update scroll position and the background offset
            this.element().scrollTo(scroll.x, scroll.y)
            this.background.style.backgroundPosition = `-${scroll.x}px -${scroll.y}px`
        }
    }

    preventDefaultBehaviour(e) {
        e.preventDefault();
    }

    scroll(e) {

        //if alt is held then ignore the scroll event
        if (e.altKey) {
            return
        }

        // if control is held prevent the browser doing its normal scrolling
        if (e.ctrlKey) {
            document.removeEventListener('wheel', this.preventDefaultBehaviour);
            document.addEventListener('wheel', this.preventDefaultBehaviour, {passive: false});
        } else {
            this.element().removeEventListener('wheel', preventDefaultBehaviour);
            return;
        }

        //ZOOM in and out
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
            //e.preventDefault()
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

        //update the background offset to match the scroll change, inverted
        this.background.style.backgroundPosition = `-${this.element().scrollLeft}px -${this.element().scrollTop}px`
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
    <div class="grid grid-background">
        <div class="tool-tip">Scale: 1px = 1cm</div>
        <slot></slot>
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
        overflow: scroll;
    }

    .grid-background {
        background-image: repeating-linear-gradient(var(--grid-foreground) 0 1px, transparent 1px 100%),
        repeating-linear-gradient(90deg, var(--grid-foreground) 0 1px, transparent 1px 100%);
        background-size: 100px 100px;
    }

    .tool-tip {
        position: absolute;
        top: 0;
        left: 0;
        color: var(--foreground, black);
        padding: 5px;
        font-size: 16px;
        z-index: 100;
    }
`

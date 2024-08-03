import Component from "./Scafold/Component.js"
import Vector from "./Vector.js"
import Shape from "./Shape.js"

export default class Grid extends Component {

    constructor({scale = 1}) {
        super()
        this._shapes = []
        this.scale = scale
        this.background = this.element() //the background is the element now.
        this.toolTip = this.element().getElementsByClassName('tool-tip')[0]

        document.addEventListener('wheel', (e) => this._onScroll(e), false)
        document.addEventListener('mousedown', (e) => this._onMouseDown(e), false)
    }

    addShape(shape) {
        if (!shape instanceof Shape) {
            throw new Error('shape must be an instance of Shape')
        }
        shape.scale = this.scale
        this.element().appendChild(shape.element())
        this._shapes[shape.id] = shape
    }

    deleteShape(shapeId) {
        if (!shapeId || typeof shapeId !== 'string') {
            throw new Error('shapeId must be a non empty string, received ' + typeof shapeId)
        }
        if (!this._shapes[shapeId]) {
            throw new Error('shape not found in grid')
        }
        this.element().removeChild(this._shapes[shapeId].element())
        delete this._shapes[shapeId]
    }

    _onMouseDown(e) {
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

        document.addEventListener('mousemove', (e) => this._onDrag(e), false)
        document.addEventListener('mouseup', () => this._onMouseUp(), false)
    }

    _onMouseUp() {
        this.positionWhenClicked = null
        document.removeEventListener('mousemove', (e) => this._onDrag(e), false)
        document.removeEventListener('mouseup', () => this._onMouseUp(), false)
    }

    _onDrag(e) {
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

            let viewCenter = new Vector(this.element().scrollLeft + this.element().clientWidth / 2, this.element().scrollTop + this.element().clientHeight / 2)
            // this.debugDrawDot(viewCenter.x, viewCenter.y, 'view center')
            let viewCenterToGridPoint = new Vector(viewCenter.x / this.scale, viewCenter.y / this.scale)
            this.debugDrawDot(viewCenterToGridPoint.x, viewCenterToGridPoint.y, 'viewCenter to gridPoint')

            let scrollPosition = new Vector(this.element().scrollLeft, this.element().scrollTop)
            console.log('scrollPosition', scrollPosition)
            this.debugDrawDot(scrollPosition.x, scrollPosition.y, 'scrollPosition')
        }
    }

    _onScroll(e) {

        if (!this.element().contains(e.target)) {
            return //if the target is not the grid, ignore the event
        }

        //if alt is held pan instead of zoom
        if (e.altKey) {
            //todo: copy the pan code into its own function and call it here
            return
        }

        //TODO: move zoom code into its own function and call it here
        //ZOOM IN AND OUT
        let maxScale = 5
        let minScale = 0.25
        let toolTip = this.toolTip
        let lookingAtGridPoint = new Vector(this.element().scrollLeft + this.element().clientWidth / 2, this.element().scrollTop + this.element().clientHeight / 2)

        if (this.scale + e.deltaY * -0.001 > maxScale || this.scale + e.deltaY * -0.001 < minScale) {

            //TODO: this should just trigger an event that the tooltip can listen for and take care of itself.

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

        // apply scale to all the shapes we have
        for (let shapeId in this._shapes) {
            this._shapes[shapeId].scale = this.scale
        }

        // Dispatch event to let the rest of app know the scale has changed
        let event = new CustomEvent('grid-scale-changed', {
            detail: {
                button: e.button,
                x: e.pageX,
                y: e.pageY,
                object: this
            }
        })
        this.dispatchEventWithDebounce(event, 0)



        //update the background and info text
        toolTip.innerText = `Scale: 1px = ${this.scale}cm`
        this.background.style.backgroundSize = `${100 * this.scale}px ${100 * this.scale}px`
        this.background.style.backgroundPosition = `-${this.element().scrollLeft}px -${this.element().scrollTop}px`
    }


    // copied from shape
    //  TODO: another reason this class should extend shape (use this version its updated).
    debugDrawDot(x, y, name = undefined) {

        console.log(name)
        if (name === undefined) {
            name = randomId()
        } else {
            console.log('debugDot:' + name, x, y)
        }

        // Keep a list of dots
        if (!this.dots) {
            this.dots = [];
        }

        // update the dot if one with the same name already exists
        for (let dot of this.dots) {
            if (dot.name === name) {
                dot.dot.style.left = x + 'px';
                dot.dot.style.top = y + 'px';
                // update the label if it has one
                if (dot.label) {
                    dot.label.innerHTML = name + '<br/> ' + x + '<br/> ' + y;
                }
                return;
            }
        }

        // Do not create a dot if one already exists with the same x and y coordinates
        for (let dot of this.dots) {
            if (dot.dot.style.left === x + 'px' && dot.dot.style.top === y + 'px') {
                return;
            }
        }

        // Create a small red dot at the given x and y coordinates
        const dot = document.createElement('div');
        dot.style.position = 'absolute';
        dot.style.width = '5px';
        dot.style.height = '5px';
        dot.style.backgroundColor = 'red';
        dot.style.left = x + 'px';
        dot.style.top = y + 'px';
        dot.style.zIndex = '999999999999999';
        this.element().appendChild(dot);

        // add label to the dot so we can see what it is
        const label = document.createElement('div');
        label.style.position = 'absolute';
        label.style.left = 10 + 'px';
        label.style.top = -5 + 'px';
        label.style.zIndex = '999999999999999';
        label.innerHTML = name + '<br/> ' + x + '<br/> ' + y;
        label.style.width = '300px';
        dot.appendChild(label);

        // Add the dot to the list
        this.dots.push({name, dot, label});
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
        overflow: hidden;
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

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
        this.spacer = this.element().getElementsByClassName('grid-spacer')[0]
    }

    html() {
        return html
    }

    style() {
        return style
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
            // update tooltip position
            this.toolTip.style.left = scroll.x + 'px'
            this.toolTip.style.top = scroll.y + 'px'
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

        // calculate the scale change
        let scaleShift = e.deltaY * -0.001
        let newScale = this.scale + scaleShift
        newScale = Math.round(newScale * 1000) / 1000 //round to 3 decimal places
        scaleShift = newScale - this.scale

        if (this.scale + scaleShift > maxScale || this.scale + scaleShift < minScale) {

            //TODO: make the tooltip listen for this event and update itself
            // this.dispatchEventWithDebounce(new CustomEvent('grid-scale-limit-reached', {
            //     detail: {
            //         scale: this.scale,
            //         maxScale,
            //         minScale,
            //         lookingAtGridPoint
            //     }
            // }), 0)

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

        /**
         * Defining some terms to clarify what's going on.
         *
         * ViewSpace: The part of the GridSpace you can see. ViewSpace = clientWidth * clientHeight of the dom element.
         *  ViewPoint: A point inside the View. The views centre ViewPoint would be: (clientWidth/2, clientHeight/2).
         *
         * GridSpace: The entire scrollable area inside the Grids dom element. GridSpace = scrollWidth * scrollHeight of the dom element.
         *  GridPoint:      The real X,Y position of anything inside the grids scrollable area.
         *  ScrollPoint:    Scrollbars left and top position as x,y. Directly maps to a GridPoint and is the 0,0 ViewPoint.
         *
         * VirtualSpace: Conceptual space using Centimetres as its measurement unit.
         *  Scale:          How many pixels of GridSpace each cm of VirtualSpace takes up. if scale is 2 then 1cm = 2px.
         *  VirtualPoint:   x, y position in VirtualSpace. A Shapes position is VirtualPoint.
         *
         * Conversions:
         *  GridPoint = ViewPoint + ScrollPoint
         *  GridPoint = VirtualPoint * Scale
         *  VirtualPoint = GridPoint / Scale
         *
         * Zooming the view, in/decreases the scale of Shapes
         * and adjusts the scroll position to keep looking at the same VirtualPoint.
         *
         * Steps:
         *  - Calculate the centre of the View.
         *  - Add the ScrollPoint to turn it into a GridPoint.
         *  - Convert the GridPoint into a VirtualPoint (the point we are looking at).
         *  -
         *  - ↕ Scale everything up.
         *  -
         *  - Convert the VirtualPoint back into a GridPoint with the new scale.
         *  - Calculate the difference of the new GridPoint
         *  - Adjust the scroll by x and y difference to center on the same VirtualPoint again.
         *
        */

        // Calculate the centre of the View.
        let viewCentre = new Vector(this.element().clientWidth / 2, this.element().clientHeight / 2);
        // Add the ScrollPoint to turn it into a GridPoint.
        let gridPoint = new Vector(
        viewCentre.x + this.element().scrollLeft,
            viewCentre.y + this.element().scrollTop
        )

        // Convert the GridPoint into a VirtualPoint.
        let virtualPoint = new Vector(
            gridPoint.x / this.scale,
            gridPoint.y / this.scale
        )

        // ↕ Scale everything up...
        this.scale += scaleShift
        for (let shapeId in this._shapes) {
            this._shapes[shapeId].scale = this.scale
        }
        this.spacer.style.height = Math.max(this.element().clientHeight, (this.element().clientHeight * this.scale)) + 'px'
        this.spacer.style.width = Math.max(this.element().clientWidth, (this.element().clientWidth * this.scale)) + 'px'

        // Convert the VirtualPoint we want to keep looking at, back into a GridPoint with the new scale.
        let newGridPoint = new Vector(
            virtualPoint.x * this.scale,
            virtualPoint.y * this.scale
        )

        // the amount to scroll to keep looking at the virtual point is the difference between the grid points
        let scrollShift =  new Vector(
            newGridPoint.x - gridPoint.x,
            newGridPoint.y - gridPoint.y
        )

        // Set the new scroll position.
        this.element().scrollLeft += scrollShift.x
        this.element().scrollTop += scrollShift.y

        //update the background and info text
        toolTip.innerText = `Scale: 1px = ${this.scale}cm`
        this.background.style.backgroundSize = `${100 * this.scale}px ${100 * this.scale}px`
        this.background.style.backgroundPosition = `-${this.element().scrollLeft}px -${this.element().scrollTop}px`
        //keep tooltip in the top left of the ViewSpace
        this.toolTip.style.left = this.element().scrollLeft + 'px'
        this.toolTip.style.top = this.element().scrollTop + 'px'

        // Let the rest of app know the scale has changed
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

    // copied from shape
    //  TODO: another reason this class should extend shape (use this version its updated).
    debugDrawDot(x, y, name = undefined) {
        if (name === undefined) {
            name = randomId()
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

        // add label to the dot, so we can see what it is
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
}

// language=HTML
const html = `
    <div class="grid grid-background">
        <div class="tool-tip">Scale: 1px = 1cm</div>
        <slot></slot>
        <div class="grid-spacer"></div>
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
        /* overflow hidden still allows scrolling if child nodes use position absolute */
    }
    
    /* make all .grid children use position absolute */
    .grid > * {
        position: absolute;
    }

    .grid-background {
        background-image: repeating-linear-gradient(var(--grid-foreground) 0 1px, transparent 1px 100%),
        repeating-linear-gradient(90deg, var(--grid-foreground) 0 1px, transparent 1px 100%);
        background-size: 100px 100px;
    }

    .tool-tip {
        top: 0;
        left: 0;
        color: var(--foreground, black);
        padding: 5px;
        font-size: 16px;
        z-index: 100;
        width: 100%;
        text-shadow: 2px 2px 2px rgba(0, 0, 0, 0.5);
    }

    .grid-spacer {
        /* spacer expands the scrollable space when zooming so point focus still works when no shapes are scaling out of view */
        opacity: 0;
        background-color: rgba(127, 255, 212, 0.26);
    }
`

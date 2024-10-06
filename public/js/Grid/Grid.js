import Component from "../ModuLatte/Component.js"
import Point from "./Point.js"
import Shape from "./Shape.js"
import Float from "../ModuLatte/Float.js"
import Text from "../ModuLatte/Text.js"

export default class Grid extends Component {

    _shapes = []
    _selectedShape

    constructor({scale = 1}) {
        super()
        this._shapes = []
        this.scale = scale
        this.background = this.element() //the background is the element now.
        this.toolTip = this.element().getElementsByClassName('tool-tip')[0]
        this.spacer = this.element().getElementsByClassName('grid-spacer')[0]
    }

    html() {
        return html
    }

    style() {
        return style
    }

    /**
     * Add a shape to the grid.
     * @param {Shape} shape
     */
    addShape(shape) {
        if (!shape instanceof Shape) throw new Error('shape must be an instance of Shape but received ' + typeof shape)
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
        this._shapes[shapeId].destroy()
        delete this._shapes[shapeId]
    }

    /**
     * @param {Shape|null} shape
     */
    set selectedShape(shape) {
        if (this._selectedShape instanceof Shape && this._selectedShape !== shape) {
            this._selectedShape.selected = false
        }
        if (shape instanceof Shape) {
            shape.selected = true
        }
        this._selectedShape = shape
    }
    get selectedShape() {
        return this._selectedShape
    }

    onMouseDown(event) {
        // record click and scroll position for the pan function to use as a reference point.
        this.positionWhenClicked = {
            scrollX: this.element().scrollLeft,
            scrollY: this.element().scrollTop,
            clickX: event.pageX,
            clickY: event.pageY
        }

        // detect if the mouse down event was on a Shape
        let shape = event.target.closest('.shape')?.componentInstance ?? null
        if (shape instanceof Shape) {
            this.selectedShape = shape
            shape.mouseDown(event)
        } else {
            this.selectedShape = null
        }
    }

    onDrag(e, initialMouseDownEvent) {
        // Pan if the alt key is held, or middle mouse button is held
        if (e.altKey || e.buttons === 4) {
            let shift = new Point(
                this.positionWhenClicked.clickX - e.pageX,
                this.positionWhenClicked.clickY - e.pageY
            )
            let from = new Point(
                this.positionWhenClicked.scrollX,
                this.positionWhenClicked.scrollY
            )
            this.pan(shift, from)
            return;
        }

        //Pass the event to selected shape, so it can resize and move.
        if (
            e.buttons === 1 && this.selectedShape instanceof Shape &&
            this.selectedShape.element().contains(initialMouseDownEvent.target)
        ) {
            this.selectedShape.drag(e, initialMouseDownEvent)
        }
    }

    onMouseMove(e) {
        if (this.selectedShape instanceof Shape) {
            this.selectedShape.hover(e)
        }
    }

    /**
     * Pan the grid by the shift amount.
     * @param {Point} shift
     * @param {Point|undefined} from
     */
    pan(shift, from = undefined) {
        if (!shift instanceof Point) throw new Error('shift must be an instance of Vector')
        if (from !== null && !from instanceof Point) throw new Error('[from must be an instance of Vector')

        if (from) {
            shift.x += from.x
            shift.y += from.y
        } else {
            shift.x += this.element().scrollLeft
            shift.y += this.element().scrollTop
        }
        //prevent numbers out of range
        shift.clamp(
            0,
            this.element().scrollWidth - this.element().clientWidth,
            0,
            this.element().scrollHeight - this.element().clientHeight
        )

        //update scroll position and the background offset
        this.element().scrollTo(shift.x, shift.y)
        this.background.style.backgroundPosition = `-${shift.x}px -${shift.y}px`
        // update tooltip position
        this.toolTip.style.left = shift.x + 'px'
        this.toolTip.style.top = shift.y + 'px'
    }

    onScroll(event) {
        if (!this.element().contains(event.target)) {
            return //if the target is not the grid, ignore the event
        }

        //if alt is held pan instead of zoom. This is great for trackpads.
        if (event.altKey) {
            let shift = new Point(event.deltaX, event.deltaY)
            //if shift key swap the x and y values
            if (event.shiftKey) {
                shift = new Point(event.deltaY, event.deltaX)
            }
            this.pan(shift)
            return
        }

        //ZOOM IN AND OUT
        let scaleInput = event.deltaY * -0.001
        this.zoom(scaleInput)
    }

    /**
     * Zoom in or out by the shift amount.
     * @param {number} shift
     */
    zoom(shift) {
        shift = Float.parse(shift, 'zoom shift must be a number')

        let maxScale = 5
        let minScale = 0.25
        let toolTip = this.toolTip

        // calculate the scale change
        const oldScale = this.scale
        let newScale = this.scale + shift
        newScale = Float.round(newScale, 0.001) //round to 3 decimal places
        newScale = Float.clamp(newScale, minScale, maxScale) // keep new scale within limits

        if (
            (this.scale === maxScale && this.scale + shift > maxScale) ||
            (this.scale === minScale && this.scale + shift < minScale)
        ) {
            //TODO: make the tooltip component listen for this event and update itself instead of requiring us to do it manually.
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
        let viewCentre = new Point(this.element().clientWidth / 2, this.element().clientHeight / 2);
        // Add the ScrollPoint to turn it into a GridPoint.
        let gridPoint = new Point(
            viewCentre.x + this.element().scrollLeft,
            viewCentre.y + this.element().scrollTop
        )

        // Convert the GridPoint into a VirtualPoint.
        let virtualPoint = new Point(
            gridPoint.x / this.scale,
            gridPoint.y / this.scale
        )

        // ↕ Scale everything up...
        this.scale = newScale
        for (let shapeId in this._shapes) {
            this._shapes[shapeId].scale = this.scale
        }
        this.spacer.style.height = Math.max(this.element().clientHeight, (this.element().clientHeight * this.scale)) + 'px'
        this.spacer.style.width = Math.max(this.element().clientWidth, (this.element().clientWidth * this.scale)) + 'px'

        // Convert the VirtualPoint we want to keep looking at, back into a GridPoint with the new scale.
        let newGridPoint = new Point(
            virtualPoint.x * this.scale,
            virtualPoint.y * this.scale
        )

        // the amount to scroll to keep looking at the virtual point is the difference between the grid points
        let scrollShift = new Point(
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
                newScale: this.scale,
                oldScale: oldScale,
                object: this
            }
        })
        this.dispatchEventWithDebounce(event)
    }


    /**
     * Draw a small red dot at the given x and y coordinates within the component element.
     * Give the dot a name to update on consecutive calls instead of creating a new one.
     * @param {number} x
     * @param {number} y
     * @param {string} name
     */
    debugDrawDot(x, y, name = '') {
        if (typeof x !== 'number') throw new Error('x must be a number')
        if (typeof y !== 'number') throw new Error('y must be a number')
        if (typeof name !== 'string') throw new Error('name must be a string')

        if (!name) {
            name = Text.randomId(8)
        }

        // Keep a list of dots
        if (!this._debugDots) {
            this._debugDots = []
        }

        // update the dot if one with the same name already exists
        for (let dot of this._debugDots) {
            if (dot.name === name) {
                dot.dot.style.left = x + 'px'
                dot.dot.style.top = y + 'px'
                // update the label if it has one
                if (dot.label) {
                    dot.label.innerHTML = name + '<br/> ' + x + '<br/> ' + y
                }
                return
            }
        }

        // Do not create a dot if one already exists with the same x and y coordinates
        for (let dot of this._debugDots) {
            if (dot.dot.style.left === x + 'px' && dot.dot.style.top === y + 'px') {
                return
            }
        }

        // Create a small red dot at the given x and y coordinates
        const dot = document.createElement('div')
        dot.style.position = 'absolute'
        dot.style.width = '5px'
        dot.style.height = '5px'
        dot.style.backgroundColor = 'red'
        dot.style.left = x + 'px'
        dot.style.top = y + 'px'
        dot.style.zIndex = '999999999999999'
        this.element().appendChild(dot)

        // add label to the dot, so we can see what it is
        const label = document.createElement('div')
        label.style.position = 'absolute'
        label.style.left = 10 + 'px'
        label.style.top = -5 + 'px'
        label.style.zIndex = '999999999999999'
        label.innerHTML = name + '<br/> ' + x + '<br/> ' + y
        label.style.width = '300px'
        dot.appendChild(label)

        // Add the dot to the list
        this._debugDots.push({name, dot, label})
    }

    /**
     * Draw a red line between two points inside the component element.
     *  Give the line a name to update it on consecutive calls instead of creating a new one.
     * @param {number} x1
     * @param {number} y1
     * @param {number} x2
     * @param {number} y2
     * @param {string} name
     */
    debugDrawLine(x1, y1, x2, y2, name = '') {
        if (typeof x1 !== 'number') throw new Error('x1 must be a number')
        if (typeof y1 !== 'number') throw new Error('y1 must be a number')
        if (typeof x2 !== 'number') throw new Error('x2 must be a number')
        if (typeof y2 !== 'number') throw new Error('y2 must be a number')
        if (typeof name !== 'string') throw new Error('name must be a string')

        // Keep a list of lines
        if (!this._debugLines) {
            this._debugLines = []
        }

        //grab exiting line or create one
        let line = this._debugLines.find(l => l.name === name)
        if (line) {
            line = line.line
        } else {
            line = document.createElement('div')
        }

        line.style.position = 'absolute'
        line.style.width = '1px'
        line.style.height = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2) + 'px'
        line.style.backgroundColor = 'red'
        line.style.left = x1 + 'px'
        line.style.top = y1 + 'px'
        line.style.transformOrigin = '0 0'
        let angle = (Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI - 90 + 360) % 360
        line.style.transform = `rotate(${angle}deg)`
        document.body.appendChild(line)

        // Add the line to the list
        this._debugLines.push({name, line})
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

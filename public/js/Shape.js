import Component from "./Scafold/Component.js";

export default class Shape extends Component {

    html() {
        return html;
    }

    style() {
        return super.style() + style;
    }

    constructor(
        id,
        parent = document.body,
        position = {
            width: 300,
            height: 300,
            x: undefined, //if undefined will center
            y: undefined, //if undefined will center
            rotation: 45
        }
    ) {
        super();
        if (typeof id !== 'string') {
            throw new TypeError('id must be a string')
        }
        this.id = id

        if (parent === undefined) {
            parent = document.body
        }
        if (!(parent instanceof Node)) {
            throw new TypeError('parent must be a node')
        }

        // for each Position value if defined should be int/float
        for (let key in position) {
            if (position[key] !== undefined && typeof position[key] !== 'number') {
                throw new TypeError('position.' + key + ' must be a number')
            }
        }

        // get the position values
        let {width, height, x, y, rotation} = position

        //If no position then center while rounding to the nearest 100
        if (x === undefined) {
            x = (parent.clientWidth / 2) - (width / 2)
            x = x - (x % 100)
        }
        if (y === undefined) {
            y = (parent.clientHeight / 2) - (height / 2)
            y = y - (y % 100)
        }

        //get labels.
        this.posText = this.element().querySelector('.posText')
        this.widthText = this.element().querySelector('.widthText')
        this.heightText = this.element().querySelector('.heightText')
        this.rotationText = this.element().querySelector('.rotationText')

        document.addEventListener('mousedown', (e) => {
            //unselect if anything other than this is clicked on
            if (e.target !== this.element()) {
                this.unselect()
                return
            }
            //record where the click happened so that drag events can use it as a point of reference
            this.clickX = e.pageX
            this.clickY = e.pageY
            this.shapePositionWhenClicked = this.position

            //mark the shape as selected (important)
            this.select()

            //trigger a custom event so the parent application can perform other actions.
            let event = new CustomEvent('shape-click', {
                detail: {
                    button: e.button,
                    x: e.pageX,
                    y: e.pageY,
                    shape: this
                }
            })
            this.element().dispatchEvent(event)

            //if not primary mouse button then don't bother with move and resize events.
            if (e.buttons !== 1) {
                return
            }

            //add event listeners for moving and resizing
            document.addEventListener('mousemove', (e) => this.drag(e), false)
            document.addEventListener('mouseup', () => this.up(), false)
        })

        //add event listener for hovering
        document.addEventListener('mousemove', (e) => this.hover(e), false)

        //anything stored in this is needed by other functions
        this.parent = parent

        //Add the element to the parent, and position it.
        this.parent.appendChild(this.element())
        this.position = {x, y, width, height, rotation}

        //add event listener for grid-scale-changed
        this.parent.addEventListener('grid-scale-changed', (e) => {
            //if the grid is not the parent then don't bother
            if (e.detail.object !== this.parent) {
                // return
            }

            this.scale = e.detail.object.scale
        })

        //rotate the shape when the rotation handle is dragged
        let rotationHandles = this.element().getElementsByClassName('rotation-handle')
        for (let i = 0; i < rotationHandles.length; i++) {
            let handle = rotationHandles[i]
            handle.addEventListener('mousedown', (e) => {
                //record where the click happened so that drag events can use it as a point of reference
                this.clickX = e.pageX
                this.clickY = e.pageY
                this.shapePositionWhenClicked = this.position

                //mark the shape as selected (important)
                this.select()

                //if not primary mouse button then don't bother with move and resize events.
                if (e.buttons !== 1) {
                    return
                }

                //add event listeners for moving and resizing
                document.addEventListener('mousemove', (e) => this.rotate(e), false)
                document.addEventListener('mouseup', () => this.up(), false)
            })
        }
    }

    select() {
        this.selected = true
        //add selected class
        this.element().classList.add('selected')
    }

    unselect() {
        this.selected = false
        //remove selected class
        this.element().classList.remove('selected')
    }

    drag(e) {
        //if not selected or mouse is not down then don't move
        if (!this.selected || e.buttons !== 1) {
            return
        }

        let shiftX = e.pageX - this.clickX;
        let shiftY = e.pageY - this.clickY;

        //apply the scale to the shift to get the virtual shift in the grid space
        shiftX = shiftX / this.scale
        shiftY = shiftY / this.scale

        //snap shift to grid snap
        let snap = this.parent.snap || 1
        shiftX = shiftX - (shiftX % snap)
        shiftY = shiftY - (shiftY % snap)

        let { x, y, width, height } = this.shapePositionWhenClicked;

        if (this.resizing) {
            //resize the shape
            if (this.resizing.includes('left')) {
                x = this.shapePositionWhenClicked.x + shiftX
                width = this.shapePositionWhenClicked.width - shiftX
            }
            if (this.resizing.includes('right')) {
                width = this.shapePositionWhenClicked.width + shiftX
            }
            if (this.resizing.includes('top')) {
                y = this.shapePositionWhenClicked.y + shiftY
                height = this.shapePositionWhenClicked.height - shiftY
            }
            if (this.resizing.includes('bottom')) {
                height = this.shapePositionWhenClicked.height + shiftY
            }
        } else {
            //move the shape only
            x = this.shapePositionWhenClicked.x + shiftX
            y = this.shapePositionWhenClicked.y + shiftY
        }

        this.position = {x, y, width, height}
    }

    rotate(e) {
        //if not selected or mouse is not down then don't move
        if (/*!this.selected ||*/ e.buttons !== 1) {
            return
        }

        let shiftX = e.pageX - this.clickX;
        let shiftY = e.pageY - this.clickY;

        //apply the scale to the shift to get the virtual shift in the grid space
        shiftX = shiftX / this.scale
        shiftY = shiftY / this.scale

        //snap shift to grid snap
        let snap = this.parent.snap || 1
        shiftX = shiftX - (shiftX % snap)
        shiftY = shiftY - (shiftY % snap)

        let { x, y, width, height, rotation } = this.shapePositionWhenClicked;

        let angle = Math.atan2(shiftY, shiftX) * 180 / Math.PI
        angle = angle - (angle % 15)

        rotation = this.shapePositionWhenClicked.rotation + angle

        this.position = {x, y, width, height, rotation}
    }

    up() {
        document.removeEventListener('mouseup', () => this.up(), false)
    }

    redraw() {
        let pos = this.position
        // Calculate scaled position
        const sPos = {
            x: pos.x * this.scale,
            y: pos.y * this.scale,
            width: pos.width * this.scale,
            height: pos.height * this.scale,
        };

        // Apply the scaled position to the element
        this.element().style.top = sPos.y + 'px'
        this.element().style.left = sPos.x + 'px'
        this.element().style.width = sPos.width + 'px'
        this.element().style.height = sPos.height + 'px'
        this.element().style.transform = `rotate(${pos.rotation}deg)`

        // Update the labels
        this.posText.innerHTML = 'x: ' + pos.x + ' y: ' + pos.y
        this.widthText.innerHTML = 'w: ' + pos.width
        this.heightText.innerHTML = 'h: ' + pos.height
        this.rotationText.innerHTML = 'r: ' + pos.rotation
    }

    get position() {
        return this._gridPosition;
    }

    set position({x, y, width, height, rotation}) {
        if (x < 0) x = 0
        if (y < 0) y = 0
        if (width < 0) width = 0
        if (height < 0) height = 0
        if (rotation === undefined || rotation < 0) rotation = 0
        if (rotation > 360) rotation = 360

        this._gridPosition = { x, y, width, height, rotation};
        this.redraw();
    }

    get scale() {
        return this._renderScale || 1;
    }

    set scale(value) {
        this._renderScale = value
        this.redraw()
    }


    //change the cursor to a resize cursor when hovering within 3px of the border
    hover(event) {
        //if mouse is down change nothing
        if (event.buttons === 1) {
            return
        }

        //remove previous hover effects
        this.resizing = false
        this.parent.style.cursor = 'default'
        this.element().classList.remove('resize-top-left')
        this.element().classList.remove('resize-bottom-right')
        this.element().classList.remove('resize-bottom-left')
        this.element().classList.remove('resize-top-right')
        this.element().classList.remove('resize-left')
        this.element().classList.remove('resize-right')
        this.element().classList.remove('resize-top')
        this.element().classList.remove('resize-bottom')

        if (this.selected === false || event.target !== this.element()) {
            return;
        }

        let x = event.offsetX;
        let y = event.offsetY;
        let width = this.element().offsetWidth;
        let height = this.element().offsetHeight;
        let border = 10;

        if (x < border && y < border) {
            this.resizing = 'top-left'
            //this.parent.style.cursor = 'nwse-resize'
        } else if (x > width - border && y > height - border) {
            this.resizing = 'bottom-right'
            //this.parent.style.cursor = 'nwse-resize'
        } else if (x < border && y > height - border) {
            this.resizing = 'bottom-left'
            //this.parent.style.cursor = 'nesw-resize';
        } else if (x > width - border && y < border) {
            this.resizing = 'top-right'
            //this.parent.style.cursor = 'nesw-resize'
        } else if (x < border) {
            this.resizing = 'left'
            //this.parent.style.cursor = 'ew-resize'
        } else if (x > width - border) {
            this.resizing = 'right'
            //this.parent.style.cursor = 'ew-resize'
        } else if (y < border) {
            this.resizing = 'top'
            //this.parent.style.cursor = 'ns-resize'
        } else if (y > height - border) {
            this.resizing = 'bottom'
            //this.parent.style.cursor = 'ns-resize';
        }
        //add a css class to the element matching the resize mode
        if (this.resizing) this.element().classList.add('resize-' + this.resizing)
    }
}

// language=HTML
const html = `
<div class="shape">
    <div class="posText"></div>
    <div class="widthText"></div>
    <div class="heightText"></div>
    <div class="rotationText"></div>
    <div class="top-left rotation-handle">⤵</div>
    <div class="top-right rotation-handle">⤵</div>
    <div class="bottom-left rotation-handle">⤵</div>
    <div class="bottom-right rotation-handle">⤵</div>
</div>
`

// language=CSS
const style = `
.shape {
    box-sizing: border-box;
    position: absolute;
    border: 1px solid var(--link, cornflowerblue);
    z-index: 100;
}

.shape.selected {
    z-index: 1000;
    border: 3px solid var(--link-hover, darkseagreen);
}

.selected .posText {
    display: block;
}
.posText {
    display: none;
}

.shape.resize-top-left {
    border-top-style: dotted;
    border-left-style: dotted;
    cursor: nwse-resize;
}
.shape.resize-top-right {
    border-top-style: dotted;
    border-right-style: dotted;
    cursor: nesw-resize;
}
.shape.resize-bottom-left {
    border-bottom-style: dotted;
    border-left-style: dotted;
    cursor: nesw-resize;
}
.shape.resize-bottom-right {
    border-bottom-style: dotted;
    border-right-style: dotted;
    cursor: nwse-resize;
}
.shape.resize-left {
    border-left-style: dotted;
    cursor: ew-resize;
}
.shape.resize-right {
    border-right-style: dotted;
    cursor: ew-resize;
}
.shape.resize-top {
    border-top-style: dotted;
    cursor: ns-resize;
}
.shape.resize-bottom {
    border-bottom-style: dotted;
    cursor: ns-resize;
}

.posText {
    pointer-events: none;
    user-select: none;
    position: absolute;
    top: 0;
    left: 5px;
}

.widthText {
    pointer-events: none;
    user-select: none;
    position: absolute;
    bottom: 0;
    width: 100%;
    text-align: center;
}

.heightText {
    pointer-events: none;
    user-select: none;
    position: absolute;
    bottom: 50%;
    right: -10%;
    transform: rotate(-90deg);
}

.rotationText {
    pointer-events: none;
    user-select: none;
    position: absolute;
    top: 50%;
    left: 50%;
}

.rotation-handle {
    position: absolute;
    line-height: 30px; /* center the text vertically */
    font-size: 24px;
    font-weight: bolder;
    text-align: center;
    color: var(--link);
    cursor: grab;
}

.top-left.rotation-handle {
    transform: rotate(-90deg);
    left: -25px;
    top: -25px;
    width: 25px;
    height: 25px;
}

.top-right.rotation-handle {
    transform: rotate(0deg);
    right: -25px;
    top: -25px;
    width: 25px;
    height: 25px;
}

.bottom-left.rotation-handle {
    transform: rotate(-180deg);
    left: -25px;
    bottom: -25px;
    width: 25px;
    height: 25px;
}

.bottom-right.rotation-handle {
    transform: rotate(90deg);
    right: -25px;
    bottom: -25px;
    width: 25px;
    height: 25px;
}
`

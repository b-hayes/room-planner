import Component from "../ModuLatte/Component.js";
import Point from "./Point.js"
import Position from "./Position.js"
import Loader from "../ModuLatte/Loader.js"
import Text from "../ModuLatte/Text.js"

export default class Shape extends Component {

    // identity
    id = '';

    // grid
    _gridSnap = 1;
    _gridScale = 1;
    _gridPosition = {x: 0, y: 0, width: 0, height: 0, rotation: 0};

    // states
    _selected = false;
    resizing = false;
    rotating = false;

    // event
    shapePositionWhenClicked = {};

    // labels (would be nice to use data binds instead of direct manipulations in future).
    posText = undefined;
    widthText = undefined;
    heightText = undefined;
    rotationText = undefined;

    html() {
        return html;
    }

    style() {
        return super.style() + style;
    }

    constructor(
        id = Text.randomId(),
        position = new Position (
            150,
            150,
            300,
            300,
            0
        ),
        scale = 1
    ) {
        super();
        if (!id || typeof id !== 'string') {
            throw new TypeError('id must be a unique string')
        }
        this.id = id

        // get the position values
        let {width, height, x, y, rotation} = position

        //If no position then center while rounding to the nearest 100
        if (x === undefined) {
            x = (position.width / 2) - (width / 2)
            // x = x - (x % 100)
        }
        if (y === undefined) {
            y = (position.height / 2) - (height / 2)
            // y = y - (y % 100)
        }

        //get labels.
        this.posText = this.element().querySelector('.posText')
        this.widthText = this.element().querySelector('.widthText')
        this.heightText = this.element().querySelector('.heightText')
        this.rotationText = this.element().querySelector('.rotationText')

        // set the initial position and scale (triggers a redraw twice for now).
        this.position = {x, y, width, height, rotation}
        this.scale = scale
    }

    get selected() {
        return this._selected
    }

    /**
     * @param {boolean} value
     */
    set selected(value) {
        if (typeof value !== "boolean") throw new Error("selected must be a boolean, received " + typeof value)
        this._selected = value
        if (this._selected) {
            this.element().classList.add('selected')
        } else {
            this.element().classList.remove('selected')
        }
    }

    /**
     * Calculate the real location of the centre of the shape in the window.
     *
     * @returns Point
     */
    getCentre() {
        let rect = this.element().getBoundingClientRect()
        return new Point(
            rect.left + (rect.width / 2),
            rect.top + (rect.height / 2)
        )
    }

    mouseDown(e) {
        this.shapePositionWhenClicked = this.position
    }

    drag(mouseMoveEvent, initialMouseDownEvent) {
        let center = this.getCentre()
        let rotatedMouseLocation = new Point(mouseMoveEvent.clientX, mouseMoveEvent.clientY)
            .rotate(this.position.rotation, center);
        let rotatedClickLocation = new Point(initialMouseDownEvent.clientX, initialMouseDownEvent.clientY)
            .rotate(this.position.rotation, this.getCentre());

        let rotatedShiftX = rotatedMouseLocation.x - rotatedClickLocation.x
        let rotatedShiftY = rotatedMouseLocation.y - rotatedClickLocation.y
        let shiftX = mouseMoveEvent.pageX - initialMouseDownEvent.pageX;
        let shiftY = mouseMoveEvent.pageY - initialMouseDownEvent.pageY;

        let {x, y, width, height, rotation} = this.shapePositionWhenClicked;

        //apply an inverse scale to the shift values so the change in position is without the current vue scale.
        let invertedScale = 1 / this.scale
        shiftX *= invertedScale
        shiftY *= invertedScale
        rotatedShiftX *= invertedScale
        rotatedShiftY *= invertedScale

        switch (true) {
            case this.resizing !== false:
                //resize the shape
                if (this.resizing.includes('left')) {
                    width = this.shapePositionWhenClicked.width - rotatedShiftX * 2
                }
                if (this.resizing.includes('right')) {
                    width = this.shapePositionWhenClicked.width + rotatedShiftX * 2
                }
                if (this.resizing.includes('top')) {
                    height = this.shapePositionWhenClicked.height - rotatedShiftY * 2
                }
                if (this.resizing.includes('bottom')) {
                    height = this.shapePositionWhenClicked.height + rotatedShiftY * 2
                }
                break;
            case this.rotating:
                let angleShift = new Point(mouseMoveEvent.x - center.x, mouseMoveEvent.y - center.y).angle() - new Point(initialMouseDownEvent.pageX - center.x, initialMouseDownEvent.pageY - center.y).angle()
                rotation = this.shapePositionWhenClicked.rotation + angleShift
                break;
            default:
                //move the shape only
                x = this.shapePositionWhenClicked.x + shiftX
                y = this.shapePositionWhenClicked.y + shiftY
        }


        this.position = {x, y, width, height, rotation}
    }

    /**
     * Returns a copy of object with all numerical values in the object.
     *  'rotation' is excluded from the scaling.
     *
     * @param object
     * @param scale
     */
    getScaled(object, scale = this.scale) {
        //clone the object
        object = {...object}
        for (let key in object) {
            if (key === 'rotation') continue // dont scale rotation values.
            if (typeof object[key] === 'number') {
                object[key] = object[key] * scale
            }
        }
        return object
    }

    //updates real position of the element and labels etc.
    redraw() {
        const pos = this.position
        const sPos = this.getScaled(pos)

        //x and y are the center of the shape, so we need to adjust the position to be the top left corner
        // because that's how the browser positions elements.
        sPos.x = sPos.x - sPos.width / 2
        sPos.y = sPos.y - sPos.height / 2

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

    //Virtual position. Not the real position of the element.
    get position() {
        return this._gridPosition;
    }

    //Virtual position. Not the real position of the element.
    set  position({x, y, width, height, rotation}) {
        // make sure we have Numbers and not strings
        width = parseFloat(width) ?? 300
        height = parseFloat(height) ?? 300
        x = parseFloat(x) ?? 150
        y = parseFloat(y) ?? 150
        rotation = parseFloat(rotation) ?? 0

        // limits
        let minX = width / 2
        let minY = height / 2

        //minx and Y should adjust for the rotation
        let angle = rotation * (Math.PI / 180);
        let cosAngle = Math.cos(angle);
        let sinAngle = Math.sin(angle);
        let rotatedWidth = Math.abs(width * cosAngle) + Math.abs(height * sinAngle);
        let rotatedHeight = Math.abs(width * sinAngle) + Math.abs(height * cosAngle);
        minX = rotatedWidth / 2
        minY = rotatedHeight / 2

        let minWidth = 10
        let minHeight = 10

        // clamp values
        if (x < minX) x = minX
        if (y < minY) y = minY
        if (width < minWidth) width = minWidth
        if (height < minHeight) height = minHeight
        if (rotation === undefined) rotation = 0
        if (rotation < 0) rotation += 360;
        if (rotation > 360) rotation -= 360;

        //apply snap
        let snap = this.snap
        x = x - (x % snap)
        y = y - (y % snap)
        width = width - (width % snap)
        height = height - (height % snap)
        rotation = rotation - (rotation % snap)

        this._gridPosition = {x, y, width, height, rotation};
        this.redraw();
    }

    get scale() {
        return this._gridScale || 1;
    }

    set scale(value) {
        this._gridScale = value
        this.redraw()
    }

    get snap() {
        return this._gridSnap || 1;
    }

    set snap(value) {
        this._gridSnap = value
    }

    hover(event) {
        //if mouse is down change nothing because the set mode will now be used in the drag method.
        if (event.buttons === 1) {
            return
        }

        //reset the resizing and rotating modes before checking for new ones
        this.resizing = false
        this.rotating = false
        this.element().classList.remove('rotating')
        this.element().classList.remove('resize-top-left')
        this.element().classList.remove('resize-bottom-right')
        this.element().classList.remove('resize-bottom-left')
        this.element().classList.remove('resize-top-right')
        this.element().classList.remove('resize-left')
        this.element().classList.remove('resize-right')
        this.element().classList.remove('resize-top')
        this.element().classList.remove('resize-bottom')

        //if not selected then don't bother
        if (this._selected === false || this.element().contains(event.target) === false) {
            return;
        }

        //if hovering over a rotation handle then set rotation mode
        if (event.target.classList.contains('rotation-handle')) {
            this.rotating = true
            this.element().classList.add('rotating')
            return
        }

        //detect and set the resize mode
        let x = event.offsetX;
        let y = event.offsetY;
        let width = this.element().offsetWidth;
        let height = this.element().offsetHeight;
        let border = 15;

        if (x < border && y < border) {
            this.resizing = 'top-left'
        } else if (x > width - border && y > height - border) {
            this.resizing = 'bottom-right'
        } else if (x < border && y > height - border) {
            this.resizing = 'bottom-left'
        } else if (x > width - border && y < border) {
            this.resizing = 'top-right'
        } else if (x < border) {
            this.resizing = 'left'
        } else if (x > width - border) {
            this.resizing = 'right'
        } else if (y < border) {
            this.resizing = 'top'
        } else if (y > height - border) {
            this.resizing = 'bottom'
        }
        //add a css class to the element matching the resize mode
        if (this.resizing) this.element().classList.add('resize-' + this.resizing)
    }
}

// language=HTML
const html = `
    <div class="shape center-content">
        <div class="posText showWhenSelected"></div>
        <div class="widthText showWhenSelected"></div>
        <div class="heightText showWhenSelected"></div>
        <div class="rotationText showWhenSelected"></div>
        <div class="top-left rotation-handle showWhenSelected"></div>
        <div class="top-right rotation-handle showWhenSelected"></div>
        <div class="bottom-left rotation-handle showWhenSelected"></div>
        <div class="bottom-right rotation-handle showWhenSelected"></div>
        <div class="rotation-line showWhenRotating"></div>
        <img src="/img/rotate-arrow-icon.svg" alt="" class="showWhenRotating rotateIcon">
    </div>
`

// language=CSS
const style = `
    .center-content {
        display: flex;
        justify-content: center;
    }

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

    .selected .showWhenSelected {
        display: block;
    }

    .showWhenSelected {
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
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
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
        right: -10px;
        transform: rotate(-90deg);
    }

    .rotationText {
        pointer-events: none;
        user-select: none;
        position: absolute;
        top: 0;
        left: 50%;
        transform: translate(-50%);
    }

    .rotation-handle {
        position: absolute;
        line-height: 30px; /* center the text vertically */
        font-size: 24px;
        font-weight: bolder;
        text-align: center;
        color: var(--link);
        cursor: grab;

        /* make the handle look like a circle */
        border-radius: 50%;
        background-color: var(--link-hover, darkseagreen);

        width: 15px;
        height: 15px;
        overflow: hidden;
    }

    .top-left.rotation-handle {
        transform: rotate(-90deg);
        left: -25px;
        top: -25px;
    }

    .top-right.rotation-handle {
        transform: rotate(0deg);
        right: -25px;
        top: -25px;
    }

    .bottom-left.rotation-handle {
        transform: rotate(-180deg);
        left: -25px;
        bottom: -25px;
    }

    .bottom-right.rotation-handle {
        transform: rotate(90deg);
        right: -25px;
        bottom: -25px;
    }

    .rotating .showWhenRotating {
        display: block;
    }

    .showWhenRotating {
        display: none;
    }

    .rotation-line {
        position: absolute;
        width: 1px;
        height: 50%;
        background-color: var(--link-hover, darkseagreen);
        left: 50%;
        top: 0;
    }

    .rotateIcon {
        -webkit-user-drag: none;
        color: var(--link-hover, darkseagreen);
        opacity: 0.3;
        max-width: 100%;
        max-height: 100%;
    }
`

import Component from "../ModuLatte/Component.js";
import Point from "./Point.js"
import Position from "./Position.js"
import Text from "../ModuLatte/Text.js"

export default class Shape extends Component {

    // identity
    id = '';

    // grouping
    parentId = '';
    isRoom = false;
    category = '';

    // stacking, in cm off the floor
    _height = 0;
    _base = 0;
    _parts = [];

    // grid
    _gridSnap = 0.5;
    _gridScale = 1;
    _gridPosition = {x: 0, y: 0, width: 0, height: 0, rotation: 0};

    // background image
    _backgroundImage = '';

    // states
    _selected = false;
    resizing = false;
    rotating = false;

    // event related
    shapePositionWhenClicked = {};

    // labels (would be nice to use data binds instead of direct manipulations in the future).
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
        scale = 1,
        backgroundImage = ''
    ) {
        super();
        if (!id || typeof id !== 'string') {
            throw new TypeError('id must be a unique string')
        }
        this.id = id

        // get labels. these will be updated when a re-draw is triggered.
        this.posText = this.element().querySelector('.posText')
        this.widthText = this.element().querySelector('.widthText')
        this.heightText = this.element().querySelector('.heightText')
        this.rotationText = this.element().querySelector('.rotationText')

        // both of these trigger a re-draw, which means an extra unnecessary re-draw.
        this.position = position
        this.scale = scale
        this.backgroundImage = backgroundImage
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
     * Calculate the real center location of the shape in the window.
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

    // the resize cursor for an edge, turned with the shape
    static resizeCursor(edge, rotation) {
        const edgeAngles = {
            'top': 0, 'top-right': 45, 'right': 90, 'bottom-right': 135,
            'bottom': 180, 'bottom-left': 225, 'left': 270, 'top-left': 315
        }
        const cursors = ['ns-resize', 'nesw-resize', 'ew-resize', 'nwse-resize']
        const step = Math.round((edgeAngles[edge] + rotation) / 45)
        return cursors[((step % 4) + 4) % 4]
    }

    static rotatedSize(width, height, rotation) {
        const angle = rotation * (Math.PI / 180)
        const cos = Math.abs(Math.cos(angle))
        const sin = Math.abs(Math.sin(angle))
        return {width: width * cos + height * sin, height: width * sin + height * cos}
    }

    get height() {
        return this._height
    }

    set height(value) {
        if (typeof value !== 'number' || value < 0) throw new TypeError('height must be a positive number')
        this._height = value
        this.restack()
    }

    get base() {
        return this._base
    }

    set base(value) {
        this._base = value
        this.restack()
    }

    get top() {
        return this.base + this.height
    }

    // Images drawn at their own heights, e.g. a chair's seat, arms and back.
    set parts(parts) {
        this._parts.forEach(({element}) => element.remove())
        this._parts = parts.map(({image, height}) => {
            const element = document.createElement('div')
            element.className = 'shape-part'
            element.style.backgroundImage = `url(${image})`
            return {height, element}
        })
        this.element().classList.toggle('has-parts', parts.length > 0)
        this.element().parentElement?.append(...this.partElements())
        this.redraw()
        this.restack()
    }

    // Only these areas catch the mouse while unselected, e.g. the arms of a corner desk.
    // Each is [x, y, width, height] as fractions of the shape.
    set hitAreas(areas) {
        this.element().querySelectorAll('.hit-area').forEach(element => element.remove())
        areas.forEach(([x, y, width, height]) => {
            const element = document.createElement('div')
            element.className = 'hit-area'
            element.style.left = x * 100 + '%'
            element.style.top = y * 100 + '%'
            element.style.width = width * 100 + '%'
            element.style.height = height * 100 + '%'
            element.componentInstance = this
            this.element().append(element)
        })
        this.element().classList.toggle('has-hit-areas', areas.length > 0)
    }

    partElements() {
        return this._parts.map(({element}) => element)
    }

    layerOf(top) {
        return Math.round(top * 10)
    }

    restack() {
        this.element().style.setProperty('--layer', this.layerOf(this.top))
        this._parts.forEach(({height, element}) => {
            element.style.zIndex = 100 + this.layerOf(this.base + height) * 2
        })
    }

    destroy() {
        this._parts.forEach(({element}) => element.remove())
        super.destroy()
    }

    get isRoomObject() {
        return this.category === 'roomObject'
    }

    // rooms sit on the grid, room objects only sit in rooms and hold nothing
    canDropOnto(target) {
        return !this.isRoom && !target.isRoomObject && (!this.isRoomObject || target.isRoom)
    }

    get moving() {
        return this.resizing === false && !this.rotating
    }

    mouseDown(e) {
        this.shapePositionWhenClicked = this.position
    }

    drag(mouseMoveEvent, initialMouseDownEvent) {
        // mouse events are translated to be relative to the rotation scale.
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

        // apply an inverse scale to the shift values so the change in position is without the current view scale.
        let invertedScale = 1 / this.scale
        shiftX *= invertedScale
        shiftY *= invertedScale
        rotatedShiftX *= invertedScale
        rotatedShiftY *= invertedScale

        switch (true) {
            case this.resizing !== false: {
                // resize from the dragged edge, keeping the opposite edge in place
                const from = this.shapePositionWhenClicked
                const shift = new Point(0, 0)
                if (this.resizing.includes('left')) {
                    width = Math.max(1, from.width - rotatedShiftX)
                    shift.x = (from.width - width) / 2
                }
                if (this.resizing.includes('right')) {
                    width = Math.max(1, from.width + rotatedShiftX)
                    shift.x = (width - from.width) / 2
                }
                if (this.resizing.includes('top')) {
                    height = Math.max(1, from.height - rotatedShiftY)
                    shift.y = (from.height - height) / 2
                }
                if (this.resizing.includes('bottom')) {
                    height = Math.max(1, from.height + rotatedShiftY)
                    shift.y = (height - from.height) / 2
                }
                shift.rotate(-from.rotation)
                x = from.x + shift.x
                y = from.y + shift.y
                break;
            }
            case this.rotating:
                let angleShift = new Point(mouseMoveEvent.x - center.x, mouseMoveEvent.y - center.y).angle() - new Point(initialMouseDownEvent.pageX - center.x, initialMouseDownEvent.pageY - center.y).angle()
                rotation = this.shapePositionWhenClicked.rotation + angleShift
                break;
            default:
                //move the shape only
                x = this.shapePositionWhenClicked.x + shiftX
                y = this.shapePositionWhenClicked.y + shiftY
        }


        this.position = new Position(x, y, width, height, rotation)
    }

    /**
     * Returns a copy of the object with all numerical values in the object.
     *  'rotation' is excluded from the scaling.
     *
     * @param object
     * @param scale
     */
    getScaled(object, scale = this.scale) {
        // clone the object to avoid side effects.
        object = {...object}
        for (let key in object) {
            if (key === 'rotation') continue // dont scale rotation values.
            if (typeof object[key] === 'number') {
                object[key] = object[key] * scale
            }
        }
        return object
    }

    // updates the real position of the element and labels etc.
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
        this._parts.forEach(({element}) => {
            element.style.top = this.element().style.top
            element.style.left = this.element().style.left
            element.style.width = this.element().style.width
            element.style.height = this.element().style.height
            element.style.transform = this.element().style.transform
        })

        // Update the labels
        this.posText.innerHTML = 'x: ' + pos.x + ' y: ' + pos.y
        this.widthText.innerHTML = 'w: ' + pos.width
        this.heightText.innerHTML = 'h: ' + pos.height
        this.rotationText.innerHTML = 'r: ' + pos.rotation
    }

    // Virtual position. Not the real position of the element.
    get position() {
        return this._gridPosition;
    }

    // Virtual position. Not the real position of the element.
    set  position(position) {
        if (!(position instanceof Position)) {
            throw new TypeError('position must be an instance of Position')
        }
        let {x, y, width, height, rotation} = position;

        // limits adjusted for the rotation
        const rotatedSize = Shape.rotatedSize(width, height, rotation)
        const minX = rotatedSize.width / 2
        const minY = rotatedSize.height / 2

        let minWidth = 1
        let minHeight = 1

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

    get backgroundImage() {
        return this._backgroundImage;
    }

    set backgroundImage(value) {
        if (typeof value !== 'string') {
            throw new TypeError('backgroundImage must be a string, received ' + typeof value)
        }
        this._backgroundImage = value;
        this.element().style.backgroundImage = this._backgroundImage ? `url(${this._backgroundImage})` : ''
        this.element().style.backgroundSize = '100% 100%'
        this.element().style.backgroundPosition = 'center'
        this.element().style.backgroundRepeat = 'no-repeat'
        this.element().classList.toggle('has-image', this._backgroundImage !== '')
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
        this.element().style.cursor = ''

        //if not selected, then don't bother
        if (this._selected === false || this.element().contains(event.target) === false) {
            return;
        }

        //if hovering over a rotation handle, then set rotation mode
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
        if (this.resizing) {
            this.element().classList.add('resize-' + this.resizing)
            this.element().style.cursor = Shape.resizeCursor(this.resizing, this.position.rotation)
        }
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
        z-index: calc(100 + var(--layer, 0) * 2);
    }

    .shape.has-image {
        border-color: transparent;
    }

    .shape:hover {
        border: 1px solid var(--link-hover, darkseagreen);
    }

    .shape.selected {
        z-index: 50000; /* the selected shape and its controls draw above everything */
        border: 3px solid var(--link-hover, darkseagreen);
    }

    .shape.has-parts {
        background-image: none !important;
    }

    .shape-part {
        position: absolute;
        pointer-events: none;
        background-size: 100% 100%;
        background-repeat: no-repeat;
    }

    .shape.has-hit-areas:not(.selected) {
        pointer-events: none;
    }

    .hit-area {
        position: absolute;
        pointer-events: auto;
    }

    .shape.selected .hit-area {
        pointer-events: none;
    }

    .shape.drop-target {
        outline: 3px solid hotpink;
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

    .posText, .widthText, .heightText, .rotationText {
        color: black;
        text-shadow: -1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white,
            0 -1px 0 white, 0 1px 0 white, -1px 0 0 white, 1px 0 0 white;
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

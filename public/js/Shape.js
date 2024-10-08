import Component from "./Scafold/Component.js";

export default class Shape extends Component {

    // identity
    id = '';

    // grid
    _gridSnap = 1;
    _gridScale = 1;
    _gridPosition = {x: 0, y: 0, width: 0, height: 0, rotation: 0};

    // states
    selected = false;
    resizing = false;
    rotating = false;

    // debug
    dots = [];
    lines = [];

    // event
    clickX = 0;
    clickY = 0;
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
        id,
        position = {
            width: 300,
            height: 300,
            x: 150,
            y: 150,
            rotation: 0
        },
        scale = 1
    ) {
        super();
        if (!id || typeof id !== 'string') {
            throw new TypeError('id must be a unique string')
        }
        this.id = id

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

        document.addEventListener('mousedown', (e) => {
            //unselect if anything other than this is clicked on
            if (
                e.target !== this.element() &&
                //if the target is a child of the shape then don't unselect
                this.element().contains(e.target) === false
            ) {
                this.unselect()
                return
            }

            //record where the click happened so that drag events can use it as a point of reference
            this.clickX = e.pageX
            this.clickY = e.pageY
            this.shapePositionWhenClicked = this.position

            //mark the shape as selected (important)
            this.select()

            //trigger a custom event so the rest of application can perform other actions.
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

        // set the initial position and scale (triggers a redraw twice for now).
        this.position = {x, y, width, height, rotation}
        this.scale = scale
    }

    //Calculate the real location of the centre of the shape in the window.
    getCentre() {
        let rect = this.element().getBoundingClientRect()
        return {
            x: rect.left + (rect.width / 2),
            y: rect.top + (rect.height / 2)
        }
    }

    //Get the angle for a point as if it was rotating around 0,0w with 0deg being up.
    getPointAngle(x, y) {
        // Atan operates in the range of -180 to 180deg with up being 0deg and returns the result in radians.
        let radians = Math.atan2(y, x);
        let degrees = radians * (180 / Math.PI);
        degrees = (degrees < 0) ? degrees + 360 : degrees;
        // Adjust the angle to be relevant to the orientation of CSS (Atan uses X axis as 0deg and CSS uses Y axis as 0deg).
        return (degrees + 90) % 360;
    }

    //Translate the event coordinates to match the rotation of the shape.
    translateMouseEvent(event, rotation) {
        const rect = this.element().getBoundingClientRect();
        let centre = {
            x: rect.left + (rect.width / 2),
            y: rect.top + (rect.height / 2)
        }

        const mouseX = event.clientX - centre.x
        const mouseY = event.clientY - centre.y

        const angleRadians = rotation * (Math.PI / 180);
        const cosAngle = Math.cos(-angleRadians);
        const sinAngle = Math.sin(-angleRadians);

        const rotatedX = mouseX * cosAngle - mouseY * sinAngle;
        const rotatedY = mouseX * sinAngle + mouseY * cosAngle;

        const clickAngle = Math.atan2(rotatedY, rotatedX) * (180 / Math.PI)

        return {x: rotatedX + centre.x, y: rotatedY + centre.y, angle: clickAngle}
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
        //if not selected or mouse is not down then we don't process anything.
        if (!this.selected || e.buttons !== 1) {
            return
        }

        //currently using alt to pan in grid and don't want to move shapes around by accident.
        if (e.altKey) {
            return
        }

        let center = this.getCentre()

        let translatedEvent = this.translateMouseEvent(e, this.position.rotation);
        let rotatedClickLocation = this.translateMouseEvent({
            clientX: this.clickX,
            clientY: this.clickY
        }, this.position.rotation);

        let rotatedShiftX = translatedEvent.x - rotatedClickLocation.x
        let rotatedShiftY = translatedEvent.y - rotatedClickLocation.y

        let shiftX = e.pageX - this.clickX;
        let shiftY = e.pageY - this.clickY;
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
                let angleShift = this.getPointAngle(e.x - center.x, e.y - center.y) - this.getPointAngle(this.clickX - center.x, this.clickY - center.y)
                rotation = this.shapePositionWhenClicked.rotation + angleShift
                break;
            default:
                //move the shape only
                x = this.shapePositionWhenClicked.x + shiftX
                y = this.shapePositionWhenClicked.y + shiftY
        }

        this.position = {x, y, width, height, rotation}
    }

    up() {
        document.removeEventListener('mouseup', () => this.up(), false)
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
    set position({x, y, width, height, rotation}) {
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
        if (this.selected === false || this.element().contains(event.target) === false) {
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


    /**
     * Draw a small red dot at the given x and y coordinates for debugging purposes.
     * Give the dot a name to track a point/update the dot instead of creating a new one.
     */
    debugDrawDot(x, y, name = undefined) {
        // Keep a list of dots
        if (!this.dots) {
            this.dots = [];
        }

        // update the dot if one with the same name already exists
        for (let dot of this.dots) {
            if (dot.name === name) {
                dot.dot.style.left = x + 'px';
                dot.dot.style.top = y + 'px';
                return;
            }
        }

        // Do not create a dot if one already exists with the same x and y coordinates
        for (let dot of this.dots) {
            if (dot.style.left === x + 'px' && dot.style.top === y + 'px') {
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
        document.body.appendChild(dot);

        // Add the dot to the list
        this.dots.push({name, dot});
    }

    debugDrawLine(x1, y1, x2, y2, name = 'line') {

        // Keep a list of lines
        if (!this.lines) {
            this.lines = [];
        }

        //grab exiting line or create one
        let line = this.lines.find(l => l.name === name)
        if (line) {
            line = line.line
        } else {
            line = document.createElement('div');
        }

        line.style.position = 'absolute';
        line.style.width = '1px';
        line.style.height = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2) + 'px';
        line.style.backgroundColor = 'red';
        line.style.left = x1 + 'px';
        line.style.top = y1 + 'px';
        line.style.transformOrigin = '0 0';
        let angle = (Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI - 90 + 360) % 360;
        line.style.transform = `rotate(${angle}deg)`;
        document.body.appendChild(line);

        // Add the line to the list
        this.lines.push({name, line});
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
        color: var(--link-hover, darkseagreen);
        opacity: 0.3;
        max-width: 100%;
        max-height: 100%;
    }
`

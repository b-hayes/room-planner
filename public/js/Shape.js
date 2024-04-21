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
            rotation: 0
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

    }

    //Transform coordinates to be relative to the elements centre point, as if center was at 0,0.
    //  e.g. a click to the left and below the shapes center would have negative x and y values.
    getPointRelativeToCenter(x,y) {
        let rect = this.element().getBoundingClientRect()
        let centre = {
            x: rect.left + (rect.width / 2),
            y: rect.top + (rect.height / 2)
        }

        return {x: x - centre.x, y: y - centre.y}
    }

    //Get the clockwise angle for a point as if it was rotating around 0,0 starting from up direction being 0 degrees.
    getPointAngle(x, y) {
        //Atan operates in the range of -180 to 180deg with up being 0deg and returns the result in radians.
        let radians = Math.atan2(y, x)
        let degrees = radians * (180 / Math.PI)
        return (degrees < 0) ? degrees + 360 : degrees
    }

    //Rotate coordinates around 0,0 to the rotation amount and return the new point location.
    getPointRotated(x, y, rotation) {
        const angleRadians = rotation * (Math.PI / 180);
        const cosAngle = Math.cos(-angleRadians);
        const sinAngle = Math.sin(-angleRadians);

        const rotatedX = x * cosAngle - y * sinAngle;
        const rotatedY = x * sinAngle + y * cosAngle;

        return { x: rotatedX + x, y: rotatedY + y };
    }

    translateCoordinates(x, y) {
        let relative = this.getPointRelativeToCenter(x, y)
        let rotated = this.getPointRotated(relative.x, relative.y, this.position.rotation)
        let clickAngle = this.getPointAngle(rotated.x, rotated.y)
        return {x: rotated.x, y: rotated.y, rotation: clickAngle}
    }


    //the original way the worked for rotated resizing...
    translateMouseEvent(event, rotation) {
        const rect = this.element().getBoundingClientRect();
        const offsetX = rect.left + (rect.width / 2);
        const offsetY = rect.top + (rect.height / 2);

        const mouseX = event.clientX - offsetX;
        const mouseY = event.clientY - offsetY;

        const angleRadians = rotation * (Math.PI / 180);
        const cosAngle = Math.cos(-angleRadians);
        const sinAngle = Math.sin(-angleRadians);

        const rotatedX = mouseX * cosAngle - mouseY * sinAngle;
        const rotatedY = mouseX * sinAngle + mouseY * cosAngle;

        return { x: rotatedX + offsetX, y: rotatedY + offsetY };
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

        // let rotatedEventLocation = this.translateCoordinates(e.clientX, e.clientY);
        // let rotatedClickLocation = this.translateCoordinates(this.clickX, this.clickY);
        let rotatedEventLocation = this.translateMouseEvent(e, this.position.rotation);
        let rotatedClickLocation = this.translateMouseEvent({clientX: this.clickX, clientY: this.clickY}, this.position.rotation);

        let rotatedShiftX = rotatedEventLocation.x - rotatedClickLocation.x
        let rotatedShiftY = rotatedEventLocation.y - rotatedClickLocation.y

        let shiftX = e.pageX - this.clickX;
        let shiftY = e.pageY - this.clickY;
        let {x, y, width, height, rotation} = this.shapePositionWhenClicked;

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
                // using atan2 assumes the center point of the angle is 0,0 and straight up is 0 radians/degrees.
                // this allows it to calculate an angle based on a single point assumed to be the other end of the line.
                //  x of 0 and any positive y is 0 degrees because +y is up. -y is down so 0, -anything is 180degrees.
                //  once the line passes 180degrees however it becomes -179 because and starts working back up t 0 again
                //  -5,-5 is -135 degrees, -5,0 is -90 etc
                //  Just remember while I talk above in X and Y but atan2 in js take y first then x in param order.

                //the x and y of the shapes needs to be taken away from the click x and y for atan to treat the center of the shape as 0,0 and calculate correct angles.
                //  relativePosition = eventPosition shapePosition
                //  radians = atan2( relativePosition.y, .x)
                //  degrees = radians * (180 / PI ) //this will be from -180 to 180 because of how atan works.
                //because we would get -180 to 180 we should add 360 if we have a negative number because shape position uses in 0-360.
                //  normalized = (degrees < 0) ? degrees + 360 : degrees
                //now we should have done this same calculation for the first mouse click and recorded it so we can do a diff
                //  shiftDeg = normalized normalizedDegreesOfInitialCLick
                // todo: adjust the above logic because the final addition doesnt make sense. Perhaps we dont normalize it at all and treat the initial click as up/0 deg by rotating the events?
                //  might even be easier to think about this if the rotation handle is straight up and the events are relative tot he current rotation via the translate function I use for other stuff.

                // Normalize the rotation to be between 0 and 360
                if (rotation < 0) rotation += 360;
                if (rotation > 360) rotation -= 360;
                break;
            default:
                //move the shape only
                x = this.shapePositionWhenClicked.x + shiftX
                y = this.shapePositionWhenClicked.y + shiftY
        }

        //apply snap
        let snap = this.parent.snap || 1
        x = x - (x % snap)
        y = y - (y % snap)
        width = width - (width % snap)
        height = height - (height % snap)
        rotation = rotation - (rotation % snap)

        this.position = {x, y, width, height, rotation}
    }

    up() {
        document.removeEventListener('mouseup', () => this.up(), false)
    }

    //updates real position of the element and labels etc.
    redraw() {
        let pos = this.position
        // Calculate scaled position
        const sPos = {
            x: pos.x * this.scale,
            y: pos.y * this.scale,
            width: pos.width * this.scale,
            height: pos.height * this.scale,
        };

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
        if (x < 0) x = 0
        if (y < 0) y = 0
        if (width < 0) width = 0
        if (height < 0) height = 0
        if (rotation === undefined) rotation = 0
        if (rotation < 0 || rotation > 360) throw new Error('Rotation out of range.')

        this._gridPosition = {x, y, width, height, rotation};
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

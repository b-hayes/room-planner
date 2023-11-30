const style = `
.shape {
    position: absolute;
    border: 1px solid var(--link);
}

.shape.selected {
    border: 3px solid var(--link-hover);
    /*box-shadow: inset 0 0 0 2px var(--link-hover);*/
    z-index: 1;
}
.shape.selected .posText {
    display: block;
}
.shape .posText {
    display: none;
}

.shape.resize-top-left {
    border-top-style: dotted;
    border-left-style: dotted;
}
.shape.resize-top-right {
    border-top-style: dotted;
    border-right-style: dotted;
}
.shape.resize-bottom-left {
    border-bottom-style: dotted;
    border-left-style: dotted;
}
.shape.resize-bottom-right {
    border-bottom-style: dotted;
    border-right-style: dotted;
}
.shape.resize-left {
    border-left-style: dotted;
}
.shape.resize-right {
    border-right-style: dotted;
}
.shape.resize-top {
    border-top-style: dotted;
}
.shape.resize-bottom {
    border-bottom-style: dotted;
}
`

class Shape {
    constructor(
        width = 300,
        height = 300,
        colour = 'var(--link)',
        parent = undefined, //if undefined will attach to nearest grid || document.body
        x = undefined, //if undefined will center
        y = undefined, //if undefined will center
    ) {
        //add style to document if it's not already there
        if (!document.getElementById('shapeStyle')) {
            let styleElement = document.createElement('style')
            styleElement.id = 'shapeStyle'
            styleElement.innerHTML = style
            document.head.appendChild(styleElement)
        }

        if (parent === undefined) {
            parent = document.body.closest('.grid') ? document.body.closest('.grid') : document.body
        }

        //If no position then center while rounding to nearest 100
        if (x === undefined) {
            x = (parent.clientWidth / 2) - (width / 2)
            x = x - (x % 100)
        }
        if (y === undefined) {
            y = (parent.clientHeight / 2) - (height / 2)
            y = y - (y % 100)
        }

        this.element = document.createElement('div')
        this.element.style.position = 'absolute'
        this.element.style.border = '1px solid ' + this.colour
        //add shape class
        this.element.classList.add('shape')

        //create position label.
        this.posText = document.createElement('div')
        this.posText.style.position = 'absolute'
        this.posText.style.top = '0'
        this.posText.style.left = '0'

        //prevent all mouse events from interacting with the posText
        this.posText.style.pointerEvents = 'none'
        this.element.appendChild(this.posText)

        document.addEventListener('mousedown', (e) => {
            //unselect if anything other than this is clicked on
            if (e.target !== this.element) {
                this.unselect()
                return
            }
            //record where the click happened so that drag events can use it as a point of reference
            this.clickX = e.pageX
            this.clickY = e.pageY
            this.shapePositionWhenClicked = this.position

            //select the shape to make it more noticeable
            this.select()
            //add event listeners for moving and unselecting
            document.addEventListener('mousemove', (e) => this.drag(e), false)
            document.addEventListener('mouseup', () => this.up(), false)
        })

        //add event listener for hovering
        document.addEventListener('mousemove', (e) => this.hover(e), false)

        //anything stored in this is needed by other functions
        this.colour = colour
        this.parent = parent

        //start selected so the user can notice when it's added.
        this.select()
        //update the position, size and related labels
        this.update(x, y, width, height)
        //Add the element to the parent
        this.parent.appendChild(this.element)
    }

    /* When clicking the shape make the border match the css var for --link-hover */
    select() {
        this.selected = true
        //add selected class
        this.element.classList.add('selected')
    }

    //When un-clicking the shape make the border match the css var for --foreground
    unselect() {
        this.selected = false
        //remove selected class
        this.element.classList.remove('selected')
    }

    drag(e) {
        //if not selected or mouse is not down then don't move
        if (!this.selected || e.buttons !== 1) {
            return
        }

        let shiftX = e.pageX - this.clickX;
        let shiftY = e.pageY - this.clickY;
        if (this.resizing) {
            //resize the shape
            let x = this.shapePositionWhenClicked.x
            let y = this.shapePositionWhenClicked.y
            let width = this.shapePositionWhenClicked.width
            let height = this.shapePositionWhenClicked.height

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

            this.update(x, y, width, height)
        } else {
            //move the shape
            this.update(this.shapePositionWhenClicked.x + shiftX,this.shapePositionWhenClicked.y + shiftY)
        }

    }

    up() {
        document.removeEventListener('mouseup', () => this.up(), false)
    }

    update(x, y, width, height) {
        let snap = this.parent.snap || 10 //provide the opportunity for the parent dictate the grid snap
        this.element.style.top = y - (y % snap) + 'px'
        this.element.style.left = x - (x % snap) + 'px'
        this.element.style.width = width + 'px'
        this.element.style.height = height + 'px'
        //update posText
        this.posText.innerHTML = 'x: ' + this.element.offsetLeft + ' y: ' + this.element.offsetTop
    }

    get position() {
        return {
            x: this.element.offsetLeft,
            y: this.element.offsetTop,
            width: this.element.offsetWidth,
            height: this.element.offsetHeight,
        }
    }

    set position({x, y, width, height}) {
        this.update(x, y, width, height)
    }


    //change the cursor to a resize cursor when hovering within 3px of the border
    hover(e) {
        //if mouse is down change nothing
        if (e.buttons === 1) {
            return
        }

        //remove previous hover effects
        this.resizing = false
        this.parent.style.cursor = 'default'
        this.element.classList.remove('resize-top-left')
        this.element.classList.remove('resize-bottom-right')
        this.element.classList.remove('resize-bottom-left')
        this.element.classList.remove('resize-top-right')
        this.element.classList.remove('resize-left')
        this.element.classList.remove('resize-right')
        this.element.classList.remove('resize-top')
        this.element.classList.remove('resize-bottom')

        if (this.selected === false || e.target !== this.element) {
            return;
        }

        let x = e.offsetX;
        let y = e.offsetY;
        let width = this.element.offsetWidth;
        let height = this.element.offsetHeight;
        let border = 10;

        if (x < border && y < border) {
            this.resizing = 'top-left'
            this.parent.style.cursor = 'nwse-resize'
        } else if (x > width - border && y > height - border) {
            this.resizing = 'bottom-right'
            this.parent.style.cursor = 'nwse-resize'
        } else if (x < border && y > height - border) {
            this.resizing = 'bottom-left'
            this.parent.style.cursor = 'nesw-resize';
        } else if (x > width - border && y < border) {
            this.resizing = 'top-right'
            this.parent.style.cursor = 'nesw-resize'
        } else if (x < border) {
            this.resizing = 'left'
            this.parent.style.cursor = 'ew-resize'
        } else if (x > width - border) {
            this.resizing = 'right'
            this.parent.style.cursor = 'ew-resize'
        } else if (y < border) {
            this.resizing = 'top'
            this.parent.style.cursor = 'ns-resize'
        } else if (y > height - border) {
            this.resizing = 'bottom'
            this.parent.style.cursor = 'ns-resize';
        }
        //add a css class to the element matching the resize mode
        if (this.resizing) this.element.classList.add('resize-' + this.resizing)
    }

}

export default Shape

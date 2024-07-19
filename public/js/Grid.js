import Component from "./Scafold/Component.js"
import Vector from "./Vector.js"
import Shape from "./Shape.js"

export default class Grid extends Component {

    constructor({scale = 1}) {
        super()
        this.scale = scale
        this.background = this.element() //the background is the element now.
        this.toolTip = this.element().getElementsByClassName('tool-tip')[0]
        document.addEventListener('mousedown', (e) => this.mouseDown(e), false)
        document.addEventListener('wheel', (e) => this.scroll(e), {passive: false})
        document.addEventListener('scroll', (e) => this.scroll(e), {passive: false})

        //prevent the browser from scrolling when control is held and account for Chrome not letting us capture the first ctrl+scroll event
        let handlingScroll = false;
        window.addEventListener('keydown', function (event) {
            if ((event.ctrlKey === true || event.metaKey === true) && handlingScroll === true) {
                event.preventDefault();
            }
        }, {passive: false});

        window.addEventListener('wheel', function (event) {
            if (event.ctrlKey === true || event.metaKey === true) {
                handlingScroll = true
                //set timeout to reset the handlingScroll variable after the scroll event is finished
                setTimeout(() => {
                    handlingScroll = false
                }, 10)
                event.preventDefault();
            } else {
                handlingScroll = false
            }
        }, {passive: false});

        document.body.onmousedown = function(e) {
            if(e.button == 1) {
                e.preventDefault();
                return false;
            }
        }
    }


    //TODO: update usages of grids and shapes to use the new addShape method and remove the old method of shapes needing a parent injected
    addShape(shape) {
        this.element().appendChild(shape.element())
    }

    shapes() {
        return Array.from(this.element().children).filter(child => child instanceof Shape)
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
        if (!this.element().contains(e.target)) {
            return
        }

        //ZOOM in and out
        if (e.ctrlKey || e.metaKey) {
            let maxScale = 5
            let minScale = 0.25
            let toolTip = this.toolTip
            let scaleShift = e.deltaY * -0.001

            //on windows using my scroll wheel the scaleShift is always 0.1 which isn't a smooth zoom amount
            // so lets change it to .01 for a smoother zoom and more control
            if (Math.abs(scaleShift) === 0.1 ) {
                scaleShift = scaleShift / 10
            }

            if (this.scale + scaleShift > maxScale || this.scale + scaleShift < minScale) {
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

            this.scale += scaleShift
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
        } else {
            e.preventDefault()
            //adjust the background offset to match the scroll position
            let shift =  new Vector(e.deltaX, e.deltaY)
            if (e.shiftKey === true) {
                shift = new Vector(e.deltaY, e.deltaX)//change the direction of the scroll if shift is held
            }

            let changingDirection = this.lastShift && this.lastShift.x * shift.x < 0 || this.lastShift && this.lastShift.y * shift.y < 0;

            //if scroll target exists then add the shift to it, otherwise create it
            if (this.scrollTarget && !changingDirection) {
                this.scrollTarget.x += shift.x
                this.scrollTarget.y += shift.y
            } else {
                this.scrollTarget = new Vector(
                    this.element().scrollLeft + shift.x,
                    this.element().scrollTop + shift.y
                )
            }

            //clamp the scroll target to the bounds of the scroll area
            this.scrollTarget.clamp(
                0,
                this.element().scrollWidth - this.element().clientWidth,
                0,
                this.element().scrollHeight - this.element().clientHeight
            )

            //if shift is less than 100 then just scroll to the target
            if (Math.abs(shift.x) < 100 && Math.abs(shift.y) < 100) {
                this.element().scrollTo(this.scrollTarget.x, this.scrollTarget.y)
                this.background.style.backgroundPosition = `-${this.scrollTarget.x}px -${this.scrollTarget.y}px`
                return
            }

            this.scrollToSmoothly(this.scrollTarget.x, this.scrollTarget.y, 150)
            this.lastShift = shift
        }
    }

    scrollToSmoothly(targetX, targetY, duration) {
        let startX = this.element().scrollLeft;
        let startY = this.element().scrollTop;
        let diffX = targetX - startX;
        let diffY = targetY - startY;
        let startTime = null;

        //if animation exists cancel it
        if (this.animationFrameId) {
            window.cancelAnimationFrame(this.animationFrameId)
        }

        let animation = (currentTime) => {
            if (startTime === null) startTime = currentTime;
            let progress = Math.min((currentTime - startTime) / duration, 1)

            let scroll = new Vector(
                startX + diffX * progress,
                startY + diffY * progress
            )

            scroll.clamp(
                0,
                this.element().scrollWidth - this.element().clientWidth,
                0,
                this.element().scrollHeight - this.element().clientHeight
            )

            this.background.style.backgroundPosition = `-${scroll.x}px -${scroll.y}px`
            this.element().scrollTo(scroll.x, scroll.y);
            if (progress < 1) {
                this.animationFrameId = window.requestAnimationFrame(animation);
            }
        };

        this.animationFrameId = window.requestAnimationFrame(animation);
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
        overflow: auto;
        /* set the scrollbars to be the same colour as the background and be thin  */
        scrollbar-width: thin;
        scrollbar-color: var(--grid-background) var(--grid-foreground);
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

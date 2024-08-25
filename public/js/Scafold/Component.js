import Loader from "./Loader.js"
import Vector from "../Vector.js"

/**
 * Sensitive methods:
 *  do not override the element method but use it to access the dom node.
 *  do not use _underscored methods in your components they are only for internal use here.
 * Requirements:
 *  you need to override the html and style methods.
 * Events:
 *  you don't need to bind event listeners, they will be added for you if you simply function for it like:
 *  onScroll, onMouseMove, onMouseDown, onMouseUp, onDrag, onDragEnter etc.
 */
export default class Component {
    static isComponent = true

    constructor() {
        // Nothing is loaded until the element is requested
    }

    /**
     * Override this method to return the html for you component
     * @returns {string}
     */
    html() {
        return ''
    }

    /**
     * Override this method to return the css for you component
     * @returns {string}
     */
    style() {
        return ''
    }

    /**
     * Returns the dom node component.
     * Loads the css, html and event listeners on first call
     * @returns {Element}
     */
    element() {
        if (this._element === undefined) this._load()
        return this._element
    }

    onTest(event) {
        console.log('test event:', event)
    }

    _load() {
        let styleId = this.constructor.name + '-' + Loader.hashString(this.style())
        Loader.loadStyles(this.style(), styleId)
        this._element = Loader.loadHtml(this.html())
        this._element.componentInstance = this

        // Setup event listeners
        const prototype = Object.getPrototypeOf(this)
        const properties = Object.getOwnPropertyNames(prototype)
        for (let i in properties) {
            let prop = properties[i]
            if (typeof this[prop] !== 'function') continue
            let listenName = ''
            if (prop.startsWith('on')) listenName = prop.substring(2).toLowerCase()
            if (prop.startsWith('_on')) listenName = prop.substring(3).toLowerCase()// _on will take precedence over on if both exist
            if (!listenName) {
                continue
            }
            // Special case for onScroll. There is no scroll event, but it's intuitive to think so.
            if (listenName === 'scroll') listenName = 'wheel'

            // Special case for onDrag. If the element does not have the draggable property, the drag method needs to be called for mousemove when the mouse is down.
            //  Adding the draggable property makes a ghost of the element go with the mouse which is often not what is wanted.
            if (listenName === 'drag'){
                listenName = 'mousemove'
                this._mouseDrag = true // tells the event handler to call the drag method when the mouse is down
            }

            // Add event listener
            console.log('Handler detected',this.constructor.name + '.' + prop, 'will be executed for', listenName)
            this._element.addEventListener(listenName, (e) => this._event(e, prop), false)
        }
    }

    _event(event, method) {
        // if event is mousemove and useMouseDrag is true then call the drag method
        if (event.type === 'mousemove' && this._mouseDrag && event.buttons) {
            method = 'onDrag'
        }
        if (event.type === 'mousedown' && this._mouseDrag) {
            this._mouseDragStarted = event // store the initial mousedown event to calculate the drag distance
        }
        // if event is mouseup and useMouseDrag is true then call the drag end
        if (event.type === 'mouseup' && this._mouseDrag) {
            method = '_mouseDragEnd'
        }

        console.log(`${method} about to be executed for event`, event)
        this[method](event)
    }

    _mouseDragStart(e) {
        this._dragStartEvent = e
        this.dragListener = (e) => this._event(e, 'drag')
        document.addEventListener('mousemove', this.dragListener, false)
        document.addEventListener('mouseup', () => this._event(e, 'mouseup'), false)
    }

    _mouseDragEnd(e) {
        this._dragStartEvent = undefined
        document.removeEventListener('mousemove', this.dragListener, false)
        document.removeEventListener('mouseup', () => this._onMouseUp(), false)
    }

    // TODO: move the debugDraw methods to shape when grid can extend shape without issues.

    /**
     * Dispatches an event with a debounce time to improve performance.
     *  If performance becomes an issue with the number of elements reacting to realtime events this could help.
     *  100ms is enough for scroll events with a trackpad not to be triggered more than once during the wind down of the scroll.
     * @param {Event} event
     * @param {number} debounceTime
     */
    dispatchEventWithDebounce(event, debounceTime = 100) {
        if (!(event instanceof Event)) throw new Error('event must be an instance of Event')
        if (typeof debounceTime !== 'number') throw new Error('debounceTime must be a number')

        //if the timeout is 0 then just dispatch the event
        if (debounceTime === 0) {
            this.element().dispatchEvent(event)
            return
        }

        if (this.debounceTimeout) {
            clearTimeout(this.debounceTimeout)
        }
        this.debounceTimeout = setTimeout(() => {
            this.element().dispatchEvent(event)
        }, debounceTime)
    }

    /**
     * Helper to throw a clear error value is not the right type
     * @param value
     * @param {string} type
     * @param {string} parameterName
     * @returns {boolean}
     */
    assertType(value, type, parameterName = 'value') {
        if (typeof value !== type) {
            throw new Error('Expected ' + parameterName + ' to be of type ' + type + ' but received ' + typeof value)
        }
        return true
    }

    /**
     * Helper to throw a clear error value is not an instance of classDefinition
     * @param value
     * @param {function} classDefinition
     * @param {string} parameterName
     * @returns {boolean}
     */
    assertInstance(value, classDefinition, parameterName = 'value') {
        if (!(value instanceof classDefinition)) {
            throw new Error(`Expected ${parameterName} to be an instance of ${classDefinition.name} but received ${value.constructor.name}`)
        }
        return true
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
            name = randomId()
        }

        // Keep a list of dots
        if (!this.dots) {
            this.dots = []
        }

        // update the dot if one with the same name already exists
        for (let dot of this.dots) {
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
        for (let dot of this.dots) {
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
        this.dots.push({name, dot, label})
    }

    /**
     * Draw a red line between two points inside the component element.
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

        //TODO: update this to track names and update lines, copy the dot code

        // Keep a list of lines
        if (!this.lines) {
            this.lines = []
        }

        //grab exiting line or create one
        let line = this.lines.find(l => l.name === name)
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
        this.lines.push({name, line})
    }


    debugListPossibleEvents() {
        //this method was going ot be used for auto binding event but there is a LOT of possible events so seemed more
        // efficient to loop over the functions instead. But wanted to keep a copy of this, so I can see the list when I want.
        const element = this.element();
        const possibleEvents = [];
        for (let key in element) {
            if (key.startsWith('on')) {
                possibleEvents.push(key.slice(2)); // Remove 'on' to get the event name that can be used with addEventListener() function
            }
        }

        return possibleEvents;
    }
}

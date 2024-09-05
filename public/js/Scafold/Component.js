import Loader from "./Loader.js"

/**
 * Sensitive methods:
 *  do not override the element method but use it to access the dom node.
 *  do not use _underscored methods in your components they are only for internal use here.
 * Requirements:
 *  you need to override the html and style methods.
 * Events:
 *  you don't need to bind event listeners, they will be added for you if you simply function for it like:
 *  onScroll, onMouseMove, onMouseDown, onMouseUp, onDrag, onDragEnter etc.
 *  If you need listeners on the document instead call them onDocScroll, onDocMouseMove etc.
 */
export default class Component {
    _eventListeners = []

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

    /**
     * @private
     */
    _load() {
        let styleId = this.constructor.name + '-' + Loader.hashString(this.style())
        Loader.loadStyles(this.style(), styleId)
        this._element = Loader.loadHtml(this.html())
        this._element.componentInstance = this

        // Setup event listeners for every onEventName function that exists (should make this a Loader function).
        const prototype = Object.getPrototypeOf(this)
        const properties = Object.getOwnPropertyNames(prototype)
        for (let i in properties) {
            let prop = properties[i]
            if (typeof this[prop] !== 'function') continue

            //console.log('Function found:',this.constructor.name + '.' + prop)

            // Ignore these next few lines. They do nothing except trick the IDE into indexing dynamic method usages.
            // Nothing would functionally change if these lines were deleted.
            let commonEventsOnly = false
            let indexUsages = [
                // add class methods names here if you want their usage indexed.
                'onMouseDown', 'onDrag',
            ];
            if (!indexUsages.includes(prop) && commonEventsOnly) {
                continue
            }
            // End of code to ignore.

            // using any function that starts with on also opens the door for onCustomEventName as well 😉.
            if (!prop.startsWith('on')) {
                continue
            }
            let listenFor = prop; //make a copy of the name.

            // Special case for onScroll. There is no 'scroll' event, but it's intuitive to think so.
            if (listenFor === 'onScroll') listenFor = 'onWheel' //map onScroll method to onWheel events.

            // Special case for onDrag. onDrag events usually only trigger if draggable property is set in html.
            //  However, the draggable property behaviour is undesirable, so I added a custom drag implementation if method exists without the property.
            if (listenFor === 'onDrag' && !this._element.draggable) {
                this._element.addEventListener('mousedown', (e) => this._mouseDragStart(e, prop), false)
                continue;
            }

            //remove the word 'on' from the start to match addEventListener syntax.
            listenFor = listenFor.substring(2).toLowerCase()
            if (!listenFor) {
                continue // ignores on with no event name
            }
            //console.log('Handler detected',this.constructor.name + '.' + prop, 'will be executed for', listenFor)
            this._addListener(listenFor, (e) => this._event(e, prop), false)
        }
    }

    /**
     * Helper to collect all the listener for this component, so they can be removed from memory if it is deleted.
     *
     * @param {String} eventName
     * @param {Function} handlerFn
     * @param {Boolean|AddEventListenerOptions} options
     * @private
     */
    _addListener(eventName, handlerFn, options = false) {
        this._element.addEventListener(eventName, handlerFn, options)
        this._eventListeners.push({eventName, handlerFn, options})
    }

    /**
     * Removes event listeners and delete its dom element.
     */
    destroy() {
        for (let listener of this._eventListeners) {
            listener.element.removeEventListener(listener.eventName, listener.handlerFn, listener.options)
        }
        this._element.remove()
    }

    _event(event, method) {
        let _method = '_' + method
        if (typeof this[_method] === 'function') {// might have wrapper methods defined in here at some point.
            return this[_method](event, method)
        }
        return this[method](event)
    }

    _onMouseDrag(mouseMoveEvent, initialMouseDownEvent, userMethod) {
        this[userMethod](mouseMoveEvent, initialMouseDownEvent)
    }

    /**
     * To be called by mousedown listener when custom drag event is used.
     * - Creates a mousemove listener to call the drag function whenever the mouse is moved.
     *    The mousemove listener also passes along the initial mousedown event, so they can calculate the distance dragged.
     * - Creates a mouseup listener to call the drag end function when the mouse is released.
     * @param {Event} mouseDownEvent
     * @param {string} userMethod
     * @private
     */
    _mouseDragStart(mouseDownEvent, userMethod) {
        this._mouseDragListener = (mouseMoveEvent) => this._onMouseDrag(mouseMoveEvent, mouseDownEvent, userMethod)
        document.addEventListener('mousemove', this._mouseDragListener, false)
        this._mouseDragEndListener = (mouseUpEvent) => this._mouseDragEnd(mouseUpEvent)
        document.addEventListener('mouseup', this._mouseDragEndListener, false)
    }

    _mouseDragEnd(e) {
        document.removeEventListener('mousemove', this._mouseDragListener, false)
        document.removeEventListener('mouseup', this._mouseDragEndListener, false)
    }

    // TODO: move the debugDraw methods to shape (or a new box class for a lower level) when grid can extend shape without issues.

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
        if (!this._debugDots) {
            this._debugDots = []``
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

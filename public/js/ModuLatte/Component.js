import Loader from "./Loader.js"
import Text from "./Text.js"

/**
 * Sensitive methods:
 *  do not override the element method but use it to access the dom node.
 *  do not use _underscored methods in your components, they are only for internal use here.
 * Requirements:
 *  you need to override the HTML and style methods.
 * Events:
 *  you don't need to bind event listeners, they will be added for you if you supply a function named for it like:
 *  onScroll, onMouseMove, onMouseDown, onMouseUp, onDrag, onDragEnter, etc.
 *  If you need listeners on the document instead, call them onDocScroll, onDocMouseMove etc.
 */
export default class Component {
    //private properties only for this class.
    _eventListeners = []

    /**
     * Override this method to return the HTML for your component
     * @returns {string}
     */
    html() {
        return ''
    }

    /**
     * Override this method to return the CSS for your component
     * @returns {string}
     */
    style() {
        return ''
    }

    /**
     * Returns the dom node component.
     * Loads the CSS, HTML and event listeners on the first call
     * @returns {Element}
     */
    element() {
        if (this._element === undefined) this._load()
        return this._element
    }

    /**
     * Called the first time the element is referenced.
     * @private
     */
    _load() {
        let styleId = this.constructor.name + '-' + Loader.hashString(this.style())
        Loader.loadStyles(this.style(), styleId)
        this._element = Loader.loadHtml(this.html())
        this._element.componentInstance = this
        Loader.setupEventListeners(this)
    }

    /**
     * Helper to add event listeners so that they are tracked and removed if the component is destroyed.
     *  JS does not remove event listeners automatically if an element is removed and can lead to memory leaks.
     *
     * @param {String} eventName
     * @param {Function} handlerFn
     * @param {Boolean|AddEventListenerOptions} options
     * @param {boolean} global  if true will add the listener to the document instead of the component element.
     * @private
     */
    _addListener(eventName, handlerFn, options = false, global = true) {
        let element = global ? document : this._element
        element.addEventListener(eventName, handlerFn, options)
        this._eventListeners.push({eventName, handlerFn, options, element})
    }

    /**
     * Removes event listeners and delete its dom element.
     */
    destroy() {
        for (let listener of this._eventListeners) {
            listener.element.removeEventListener(listener.eventName, listener.handlerFn, listener.options)
        }

        // call the destroy method on any child components if they exist.
        if (this._element.childNodes) {
            for (let child of this._element.childNodes) {
                if (child.componentInstance && typeof child.componentInstance.destroy === 'function') {
                    child.componentInstance.destroy()
                }
            }
        }

        this._element.remove()
    }

    /**
     *  All event handlers are executed via this method, enabling us to add overrides and tracking.
     *
     * @param event
     * @param method
     * @returns {*}
     * @private
     */
    _event(event, method) {
        let _method = '_' + method
        if (typeof this[_method] === 'function') {// might have wrapper methods defined in here at some point.
            return this[_method](event, method)
        }
        return this[method](event)
    }

    _mouseDragStart(mouseDownEvent, userMethod) {
        this._mouseDragListener = (mouseMoveEvent) => this._onMouseDrag(mouseMoveEvent, mouseDownEvent, userMethod)
        document.addEventListener('mousemove', this._mouseDragListener, false)
        this._mouseDragEndListener = (mouseUpEvent) => this._mouseDragEnd(mouseUpEvent)
        document.addEventListener('mouseup', this._mouseDragEndListener, false)
    }

    _onMouseDrag(mouseMoveEvent, initialMouseDownEvent, userMethod) {
        this[userMethod](mouseMoveEvent, initialMouseDownEvent)
    }

    _mouseDragEnd(e) {
        document.removeEventListener('mousemove', this._mouseDragListener, false)
        document.removeEventListener('mouseup', this._mouseDragEndListener, false)
    }

    /**
     * Dispatches an event with a debounce time to improve performance.
     *  If performance becomes an issue with the number of elements reacting to realtime events, this could help.
     *  100 ms is enough for scroll events with a trackpad not to be triggered more than once during the wind down of the scroll.
     * @param {Event} event
     * @param {number} debounceTime
     */
    dispatchEventWithDebounce(event, debounceTime = 100) {
        if (!(event instanceof Event)) throw new Error('event must be an instance of Event')
        if (typeof debounceTime !== 'number') throw new Error('debounceTime must be a number')

        //if the timeout is 0 then dispatch the event
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
}

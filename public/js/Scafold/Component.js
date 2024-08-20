import Loader from "./Loader.js"

export default class Component {
    static isComponent = true;

    constructor() {
        let styleId = this.constructor.name + '-' + Loader.hashString(this.style())
        Loader.loadStyles(this.style(), styleId)
    }

    html() {
        return ''
    }
    style() {
        return ''
    }

    element() {
        if (this._element === undefined) {
            this._element = Loader.loadHtml(this.html())
        }
        this._element.componentInstance = this
        return this._element
    }

    /**
     * Dispatches an event with a debounce time to improve performance.
     *  If performance becomes an issue with the number of elements reacting to realtime events this could help.
     *  100ms is enough for scroll events with a trackpad not to be triggered more than once during the wind down of the scroll.
     * @param {Event} event
     * @param {number} debounceTime
     */
    dispatchEventWithDebounce(event, debounceTime = 100) {
        this.requireInstance(event, Event)
        this.requireType(debounceTime, 'number', 'debounceTime must be a number')

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

    requireType(value, type, message = 'expected ' + type + ' but received ' + typeof value) {
        if (typeof value !== type) {
            throw new Error(message)
        }
    }

    requireInstance(value, instance, message = 'Expected instance of ' + instance + ' but received ' + value.constructor.name) {
        if (!(value instanceof instance)) {
            throw new Error(message)
        }
    }
}

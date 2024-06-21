import Loader from "./Loader.js"

export default class Component {
    instanceId = null
    static isComponent = true;

    constructor() {
        let styleId = this.constructor.name + '-' + Loader.hashString(this.style())
        Loader.loadStyles(this.style(), styleId)
        this.instanceId = Object.keys(window.Loader.components).length
        window.Loader.components[this.instanceId] = this
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
        return this._element
    }

    /**
     * Dispatches an event with a debounce time to improve performance.
     *  If performance becomes an issue with the number of elements reacting to realtime events this could help.
     *  100ms is enough for scroll events with a trackpad not to be triggered more than once during the wind down of the scroll.
     * @param event
     * @param debounceTime
     */
    dispatchEventWithDebounce(event, debounceTime = 100) {
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
}

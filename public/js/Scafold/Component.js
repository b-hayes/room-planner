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
        return this._element
    }

    //NOTE: 100ms is necessary for scroll events with a trackpad not to be triggered more than once during the wind down of the scroll.
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

import Loader from "./Loader.js"

export default class Component {

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
}

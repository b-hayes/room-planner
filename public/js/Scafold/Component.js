import Loader from "./Loader.js"

export default class Component {

    constructor() {
        let styleId = this.constructor.name + '-' + Loader.hashString(this.style())
        Loader.loadStyles(this.style(), styleId)
        this._element = Loader.loadHtml(this.html())
    }

    html() {
        return ''
    }
    style() {
        return ''
    }

    element() {
        return this._element
    }
}

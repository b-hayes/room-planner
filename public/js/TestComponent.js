import Component from "./Scafold/Component.js"

export default class TestComponent extends Component {

    count = 0

    _bindings = {}

    constructor() {
        super()

        // TODO:  move this the component class whens its ready to be more generic.
        // NOTE: that this would be a one line per property if it was specific to the component then you'd only need
        //  to defined the setter.

        for (let property in this) {
            this['_' + property] = this[property]
            Object.defineProperty(this, property, {
                get: () => {
                    return this['_' + property]
                },
                set: (value) => {
                    this['_' + property] = value
                    this.element().querySelector('p').innerText = `test databind ${this.count}`
                }
            })
        }
    }

    html() {
        return `
            <div>
                <p>test databind {{ count }}</p>
                <button onclick="window.Loader.components[0].count++;console.log(window.Loader.components[0].count)">Click Count</button>
            </div>
        `
    }
}
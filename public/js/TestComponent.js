import Component from "./Scafold/Component.js"

export default class TestComponent extends Component {

    count = 0

    constructor() {
        super()
        // For each property of this class instance, initialize this['_' + property] and define a getter and setter that updates the HTML element.
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
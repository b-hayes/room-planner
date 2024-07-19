import Component from "./Scafold/Component.js"

export default class TestBind extends Component {

    count = 0

    _bindings = {}

    constructor() {
        super()

        // This is a basic example of how generic data binding can be done with raw JS.
        for (let property in this) {
            //for every property create a shadow property to store the value
            this['_' + property] = this[property]

            //then grab the original property definition and replace it with a getter and setter
            Object.defineProperty(this, property, {
                get: () => {
                    return this['_' + property]
                },
                set: (value) => {
                    this['_' + property] = value
                    this.element().querySelector('p').innerText = `test databind ${this.count}`
                    //Im only accounting for a singe bind so its not going to work in this generic setup.
                    // This is where the hard part comes in. How are you going to define a single setter,
                    // that will work for all possible properties in all places.
                    // You cant just search and replace strings as the value could be anything that matches part
                    // of any other string of text.
                    //The only way it can work is if you either, replace the entire html of the component,
                    // based on the starting template, or have come complex dif checking to see what parts
                    // of the html need to be updated without replacing elements.
                }
            })
        }
    }

    // The easiest solution is to simply define a setter manually every time you want to bind a property.


    html() {
        return `
            <div>
                <p>test databind {{ count }}</p>
                <button onclick="window.Loader.components[0].count++;console.log(window.Loader.components[0].count)">Click Count</button>
            </div>
        `
    }
}
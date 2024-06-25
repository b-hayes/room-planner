import Component from "./Scafold/Component.js"

// language=HTML
const html = `
    <div>
        <p>test databind {{ count }}</p>
        <button onclick="window.Loader.components[1].count++;console.log(window.Loader.components[1].count)">Click Count</button>
    </div>
`

export default class TestBind2 extends Component {

    count = 0

    constructor() {
        super()
        // create a proxy to update the html when any property changes
        let handler = {
            set: (target, property, value) => {
                target[property] = value
                console.log('set via proxy', property, value)
                return true
            }
        }

        //todo: this should probably be in the component class as its not a proxy when its added to the loader right now.
        //  or perhaps the Loader can create the proxy when the addComponent is called.

        return new Proxy(this, handler)
    }

    html() {
        let processedHtml = html
        for (let property in this) {
            processedHtml = processedHtml.replace(new RegExp(`{{\\s*${property}\\s*}}`, 'g'), this[property])
        }
        return processedHtml
    }
}
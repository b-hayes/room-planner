import Component from "./Scafold/Component.js"

export default class TestBind2 extends Component {

    count = 0

    constructor() {
        super()
    }

    html() {
        return `
            <div>
                <p>test databind {{ count }}</p>
                <button onclick="window.Loader.components[1].count++;console.log(window.Loader.components[1].count)">Click Count</button>
            </div>
        `
    }

    htmlWithBoundValues() {
        let html = this.html()
        for (let property in this) {
            html = html.replace(new RegExp(`{{\\s*${property}\\s*}}`, 'g'), this[property])
        }
        return html
    }
}
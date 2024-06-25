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

    html() {
        return html
    }
}
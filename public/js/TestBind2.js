import Component from "./Scafold/Component.js"

export default class TestBind2 extends Component {

    count = 0

    html() {
        return `
    <div for="">
        <p>test databind {{ count }}</p>
        <button onclick="me.count++;">Click me.</button>
    </div>
`
    }
}
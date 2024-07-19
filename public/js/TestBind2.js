import Component from "./Scafold/Component.js"

export default class TestBind2 extends Component {

    count = 0

    // in this example, the loader will add a proxy to this component so that
    // any time a property is set, the component will be reloaded.
    // this is not ideal, but it's a start.

    html() {
        return `
    <div for="">
        <p>test databind {{ count }}</p>
        <button onclick="me.count++;">Click me.</button>
    </div>
`
    }
}
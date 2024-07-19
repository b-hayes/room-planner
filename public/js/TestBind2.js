import Component from "./Scafold/Component.js"

export default class TestBind2 extends Component {

    count = 0
    duplicates = 3

    // Data binding.
    // The loader will add a proxy to this component so that
    // any time a property is set, the component will be reloaded.
    // Reloading the entire component is not ideal, but it's a simple way to make the generic binding work.

    // ME.
    // The loader will also replace any `me` references with the global path to this lass instance.
    // This enables the html template to modify the class instance directly.

    //Things I'd like to add:
    // - ability to detect and replace only the elements containing binding usages.
    // - support for <div for="item in items"> to create multiple instances of the same element.
    // - support for <div if="condition"> to conditionally render an element.

    html() {
        return `
    <div>
        <p>test databind {{ count }}</p>
        <button onclick="me.count++;">Click me.</button>
    </div>
`
    }
}
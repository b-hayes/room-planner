import Component from "./Scafold/Component.js"

export default class TestComponent extends Component {

    count = 0

    html() {
        //unfortunately have noway to reference the current class instance in the html below.
        return `
            <div>
                <p>test databind {{count}}</p>
                <button onclick="window.Loader.components[0].count ++;console.log(window.Loader.components[0].count)">Click Count</button>
            </div>
        `
    }
}
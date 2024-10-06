import Component from "./Component.js"

export default class Menu extends Component{

    constructor(position = {x: 0, y: 0}, parentElement = document.body) {
        super()
        this.position = position
        let el = this.element()
        el.style.left = position.x + 'px'
        el.style.top = position.y + 'px'
        parentElement.appendChild(el)
    }

    onDocClick(event) {
        console.log('menu onDocClick', event)
        if (this.element().contains(event.target)) {
            this.destroy()
        }
    }

    html() {
        // language=html
        return `
        <div class="menu">
            <div class="menu-item">Item 1</div>
            <div class="menu-item">Item 1</div>
            <div class="menu-item">Item 1</div>
        </div>
        `
    }

    style() {
        // language=css
        return `
        .menu {
            position: absolute;
            z-index: 1000;
            background-color: var(--background);
            border: 1px solid var(--foreground);
            padding: 5px;
            border-radius: 5px;
            box-shadow: 5px 5px 10px 3px rgba(0, 0, 0, 0.5);
            cursor: pointer;
        }
        
        .menu-item {
            width: 100%;
            min-width: 100px;
        }
        
        .menu-item:hover {
            background-color: var(--link-hover);
        }
        
        /* make the menu fade in */
        .menu {
            animation: fadeIn 0.5s;
        }
        `
    }

}
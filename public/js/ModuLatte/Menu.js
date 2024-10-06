import Component from "./Component.js"

export default class Menu extends Component{

    constructor({position, items}) {
        super()
        this.position = position
        let el = this.element()

        // add menu items
        for (let item of items) {
            let menuItem = document.createElement('div')
            menuItem.classList.add('menu-item')
            menuItem.innerText = item.label
            item.destroyMenu = () => this.destroy()
                menuItem.onclick = function () {
                item.action()
                item.destroyMenu()
            }
            el.appendChild(menuItem)
        }


        el.style.left = position.x + 'px'
        el.style.top = position.y + 'px'
        document.body.appendChild(el)
        el.classList.add('grow-in')
    }

    onDocClick(event) {
        console.log('menu onDocClick', event)
        if (!this.element().contains(event.target)) {
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
            background-color: var(--background, white);
            border: 1px solid var(--foreground, black);
            padding: 5px;
            border-radius: 3px;
            box-shadow: 5px 5px 10px 3px rgba(0, 0, 0, 0.5);
            cursor: pointer;
        }
        
        .menu-item {
            width: 100%;
            min-width: 100px;
        }
        
        .menu-item:hover {
            color: var(--link-hover, darkseagreen);
        }
        
        /* make the menu grow in from top left */
        .grow-in {
            transform: scale(0);
            transform-origin: 0 0; /* Set the origin to top-left corner */
            animation: grow-in 0.2s forwards;
        }
        
        @keyframes grow-in {
            to {
                transform: scale(1);
            }
        }
        `
    }

}
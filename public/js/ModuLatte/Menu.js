import Component from "./Component.js"

export default class Menu extends Component{

    //todo: now that I am away of get/set these could just be defined as var instead of being required to be a function.
    // try it.
    //TODO: use this menu for for shape context menu, but then reduce this version to something more generic.
    html = `
    <div class="menu">
        <div class="menu-item">🚮 Delete</div>
    </div>
    `

    // language=css
    style= `
    .menu {
        position: absolute;
        z-index: 999999;
        background-color: var(--background);
        border: 1px solid var(--foreground);
        padding: 5px;
        border-radius: 5px;
        box-shadow: 5px 5px 10px 3px rgba(0, 0, 0, 0.5);
        cursor: pointer;
    }
    
    .menu-item {
        
    }
    `

}
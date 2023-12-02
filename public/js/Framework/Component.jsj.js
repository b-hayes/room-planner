export default class Component {

    //not sure where im going with this but for now this is the class for the loader methods

    loadStyles(style, name) {
        //add style to document if it's not already there
        if (!document.getElementById(name)) {
            let styleElement = document.createElement('style')

            //create a hash of the style sting
            let hash = 0;
            for (let i = 0; i < style.length; i++) {
                hash = Math.imul(31, hash) + style.charCodeAt(i) | 0;
            }

            styleElement.id = 'shapeStyle-' + hash
            styleElement.innerHTML = style
            document.head.appendChild(styleElement)
        }
    }

    loadHtml(html, parentElement) {
        //add html to document
        let element = document.createElement('div')
        element.innerHTML = html
        parentElement.appendChild(element)
    }
}

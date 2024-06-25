import Component from "./Component.js"

export default class Loader {

    static components = {}

    static addComponent(component) {
        // create a proxy to update the html when any property changes
        let handler = {
            set: (target, property, value) => {
                target[property] = value
                console.log('set via proxy', property, value)
                this.reloadComponent(target)
                return true
            }
        }
        Loader.components[component._instanceId] = new Proxy(component, handler)

        // Add a reference to the Loader class to the window.
        if (!window.Loader) window.Loader = Loader
        //todo: give loader cool name? Modulatte?
    }

    static getComponent(id) {
        return Loader.components[id]
    }

    static removeComponent(id) {
        delete Loader.components[id]
    }

    static loadStyles(style, styleId) {
        if (!style) {
            return
        }

        if (document.getElementById(styleId)) {
            return
        }

        let styleElement = document.createElement('style')
        styleElement.id = styleId
        styleElement.innerHTML = style
        document.head.appendChild(styleElement)
    }

    static loadHtml(html, data = {}) {
        let processedHtml = html;
        for (let property in data) {
            if (property.startsWith('_') || typeof data[property] === 'function') {
                continue
            }
            console.log(property)
            processedHtml = processedHtml.replace(new RegExp(`{{\\s*${property}\\s*}}`, 'g'), data[property])
        }

        let me = data._instanceId ? 'window.Loader.components[' + data._instanceId + ']' : 'me'
        //replace occurrences of "me." with the `me` variable
        processedHtml = processedHtml.replace(/me\./g, me + '.')

        let template = document.createElement('template')
        template.innerHTML = processedHtml
        return template.content.firstElementChild
    }

    static reloadComponent(Component) {
        Component._element.replaceWith(
            this.loadHtml(Component.html(), Component)
        )
    }

    static hashString(string) {
        let hash = 0;
        for (let i = 0; i < string.length; i++) {
            hash = Math.imul(31, hash) + string.charCodeAt(i) | 0;
        }
        return hash
    }

    // This is totally unnecessary since it's only used for Grid.
    // I could have just called new Grid() but I wanted to see how hard it is to dynamically load all the components.
    static async replaceTagsWithComponents(parent) {
        let tags = parent.getElementsByTagName('*')
        for (let tag of tags) {
            let tagName = tag.tagName.toLowerCase()
            //convert classname from kebab-case to PascalCase
            let className = Loader.toPascalCase(tagName)

            //skip slot
            if (['slot'].includes(tagName)) {
                continue
            }
            //skip common html tags like div span p etc
            if (['div', 'span', 'p', 'a', 'img', 'button', 'input', 'form', 'label', 'select', 'option', 'textarea', 'meta', 'head', 'script', 'link', 'html', 'body', 'title', 'style'].includes(tagName)) {
                continue
            }
            //skip all tag defined in the html 5 specification from w3c
            if (
                [
                    'html', 'head', 'title', 'base', 'link', 'meta', 'style',
                    'script', 'noscript', 'template', 'slot', 'img', 'picture', 'source', 'img', 'iframe', 'embed', 'object', 'param', 'video', 'audio', 'track', 'map', 'area', 'a', 'link', 'nav', 'ul', 'ol', 'li', 'dl', 'dt', 'dd', 'menu', 'menuitem', 'button', 'form', 'label', 'input', 'textarea', 'select', 'optgroup', 'option', 'fieldset', 'legend', 'datalist', 'output', 'progress', 'meter', 'details', 'summary', 'command', 'menu',
                    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'footer', 'address', 'main', 'section', 'article', 'aside', 'nav', 'figure', 'figcaption', 'blockquote', 'div', 'p',
                    'article', 'aside', 'details', 'figcaption', 'figure', 'footer', 'header', 'main', 'mark', 'nav', 'section', 'summary', 'time', 'audio', 'video', 'canvas', 'progress', 'meter', 'embed', 'object', 'param', 'iframe', 'picture', 'source', 'svg',
                    'datalist', 'fieldset', 'legend', 'output', 'progress', 'meter', 'table', 'caption', 'colgroup', 'col', 'tbody', 'thead', 'tfoot', 'tr', 'td',
                    'th', 'button', 'datalist', 'fieldset', 'form', 'input', 'label', 'legend', 'meter', 'optgroup', 'option', 'output', 'progress', 'select', 'textarea'
                ].includes(tagName)) {
                continue
            }

            // Dynamically import the module
            try {
                let module = await import(`/js/${className}.js`)
                // Access the class using the variable
                const LoadedClass = module.default; // Assuming the class is the default export

                if (!typeof LoadedClass === 'function') {
                    throw new Error('Class ' + className + ' is not a function')
                }

                // Check for a params attribute and parse it. todo: this should probably just copy all attributes to the component in general.
                let params = {}
                if (tag.hasAttribute('params')) {
                    params = JSON.parse(tag.getAttribute('params'))
                }

                if (!LoadedClass.prototype instanceof Component) {
                    throw new Error('Class ' + className + ' does not extend Component')
                }

                // Create a new instance
                let newInstance = new LoadedClass(params)
                let newElement = newInstance.element()

                // Replace slot content
                if (tag.innerHTML && newElement.getElementsByTagName('slot').length > 0) {
                    newElement.innerHTML = newElement.innerHTML.replace(/<slot>/g, tag.innerHTML)
                }

                tag.parentNode.replaceChild(newElement, tag)
            } catch (e) {
                console.error(e)
                continue
            }

        }
    }

    static toCamelCase(text) {
        return text.replace(/-\w/g, Loader.clearAndUpper);
    }

    static toPascalCase(text) {
        return text.replace(/(^\w|-\w)/g, Loader.clearAndUpper);
    }

    static clearAndUpper(text) {
        return text.replace(/-/, "").toUpperCase();
    }
}
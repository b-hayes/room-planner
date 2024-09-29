import Component from "./Component.js"

export default class Loader {
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

    static loadHtml(html) {
        let template = document.createElement('template')
        template.innerHTML = html
        return template.content.firstElementChild
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
    static async replaceTagsWithComponents(parent, sourceRoot = '/js/') {
        let tags = parent.getElementsByTagName('*')
        for (let tag of tags) {
            let tagName = tag.tagName.toLowerCase()
            //convert classname from kebab-case to PascalCase
            let className = Loader.toPascalCase(tagName)
            let classPath = className.replace('.', '/') + '.js'

            //skip slot
            if (['slot'].includes(tagName)) {
                continue
            }
            //skip common html tags like div span p etc
            if (['div', 'span', 'p', 'a', 'img', 'button', 'input', 'form', 'label', 'select', 'option', 'textarea', 'meta', 'head', 'script', 'link', 'html', 'body', 'title', 'style'].includes(tagName)) {
                continue
            }
            //skip all tags defined in the html 5 specification from w3c (might have missed some I was not thorough).
            if (['article', 'aside', 'details', 'figcaption', 'figure', 'footer', 'header', 'main', 'mark', 'nav', 'section', 'summary', 'time', 'audio', 'video', 'canvas', 'progress', 'meter', 'embed', 'object', 'param', 'iframe', 'picture', 'source', 'svg',
                'datalist', 'fieldset', 'legend', 'output', 'progress', 'meter', 'table', 'caption', 'colgroup', 'col', 'tbody', 'thead', 'tfoot', 'tr', 'td',
                'th', 'button', 'datalist', 'fieldset', 'form', 'input', 'label', 'legend', 'meter', 'optgroup', 'option', 'output', 'progress', 'select', 'textarea'].includes(tagName)) {
                continue
            }

            // Dynamically import the module
            let module = await import(sourceRoot + classPath)
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
                console.error('Class ' + className + ' does not extend Component')
                continue;
            }

            // Create a new instance
            let newInstance = new LoadedClass(params)
            let newElement = newInstance.element()

            // Replace slot content
            if (tag.innerHTML && newElement.getElementsByTagName('slot').length > 0) {
                newElement.innerHTML = newElement.innerHTML.replace(/<slot>/g, tag.innerHTML)
            }

            tag.parentNode.replaceChild(newElement, tag)
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

    static randomId() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    }
}
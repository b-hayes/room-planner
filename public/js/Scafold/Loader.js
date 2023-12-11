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

    static async replaceTagsWithComponents(parent) {
        let tags = parent.getElementsByTagName('*')
        for (let tag of tags) {
            let tagName = tag.tagName.toLowerCase()
            //convert classname from kebab-case to PascalCase
            let className = Loader.toPascalCase(tagName)

            //skip common html tags like div span p etc
            if (['div', 'span', 'p', 'a', 'img', 'button', 'input', 'form', 'label', 'select', 'option', 'textarea', 'meta', 'head', 'script', 'link', 'html', 'body', 'title', 'style'].includes(tagName)) {
                continue
            }
            //skip all tag defined in the html 5 specification from w3c
            if (['article', 'aside', 'details', 'figcaption', 'figure', 'footer', 'header', 'main', 'mark', 'nav', 'section', 'summary', 'time', 'audio', 'video', 'canvas', 'progress', 'meter', 'embed', 'object', 'param', 'iframe', 'picture', 'source', 'svg',
                'datalist', 'fieldset', 'legend', 'output', 'progress', 'meter', 'table', 'caption', 'colgroup', 'col', 'tbody', 'thead', 'tfoot', 'tr', 'td',
                'th', 'button', 'datalist', 'fieldset', 'form', 'input', 'label', 'legend', 'meter', 'optgroup', 'option', 'output', 'progress', 'select', 'textarea'].includes(tagName)) {
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

                //check for a params attribute and parse it
                let params = {}
                if (tag.hasAttribute('params')) {
                    params = JSON.parse(tag.getAttribute('params'))
                }

                if (!LoadedClass.prototype instanceof Component) {
                    throw new Error('Class ' + className + ' does not extend Component')
                }

                // Create a new instance
                console.log('Loader is creating a ', className, ' with ', params)
                let newInstance = new LoadedClass(params)
                let newElement = newInstance.element()

                // if tag has inner html and newElement has <slot> tags then replace them with the inner html
                if (tag.innerHTML && newElement.getElementsByTagName('slot').length > 0) {
                    console.log('tag.innerHTML', tag.innerHTML)
                    // replace all <slot> tags with the inner html
                    newElement.innerHTML = newElement.innerHTML.replace(/<slot>/g, tag.innerHTML)
                }

                console.log('Replacing ', tag, ' with ', newElement)

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
import Component from "./Component.js"
import Text from "./Text.js"

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


    /**
     * Replace any custom tag names with a matching JS Component from the source root.
     *  e.g. <Cat params='{ "constructor": "arguments" }'> will autoload /source/Cat.js module,
     *  and replace the html tag with new Cat(params).element().
     *
     * @param parent
     * @param sourceRoot
     * @returns {Promise<void>}
     */
    static async replaceTagsWithComponents(parent, sourceRoot = '/js/') {
        let tags = parent.getElementsByTagName('*')
        for (let tag of tags) {
            let tagName = tag.tagName.toLowerCase()
            //convert classname from kebab-case to PascalCase
            let className = Text.toPascalCase(tagName)
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
                console.error('Class ' + className + ' does not extend Component', LoadedClass)
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

    /**
     * Automatically assigns event listeners to any methods called on<eventName>() so the components do not have to.
     *  e.g. if component has an onMouseDown method an 'mousedown' event listener will be assigned to its element.
     *  Special cases:
     *  - onScroll() method maps to 'wheel' event because it's intuitive (imo) to think there is a scroll event.
     *  - onDrag()
     *    - If the element has the 'draggable' property, the normal 'drag' event will be bound.
     *    - if used without the 'draggable' property, a custom setup is used to pass mousemove events with the
     *      initial mousedown event that started the drag instead like so: onDrag(mouseMove, initialMouseDownEvent)
     *
     * @param component
     */
    static setupEventListeners(component) {
        // Traverse the prototype chain to include inherited methods from ancestor classes.
        let prototype = Object.getPrototypeOf(component);
        const processedMethods = new Set(); // To avoid duplicates
        while (prototype) {
            const properties = Object.getOwnPropertyNames(prototype);
            properties.forEach(prop => {
                if (processedMethods.has(prop) || typeof component[prop] !== 'function' || !prop.startsWith('on')) {
                    return //skip
                }

                // >>> Ignore these next few lines. They do nothing except trick the IDE into indexing dynamic method usages.
                // Nothing would functionally change if these lines were deleted.
                let commonEventsOnly = false
                let indexUsages = [
                    // add class methods names here if you want their usage indexed.
                    'onMouseDown', 'onDrag', 'onClick', 'onMouseDown', 'onMouseMove', 'onContextMenu', 'onScroll'
                ];
                if (!indexUsages.includes(prop) && commonEventsOnly) {
                    return
                }
                // <<< End of code to ignore.

                let listenFor, globalDocumentLister
                //remove the word 'on'|'onDoc' from the start to match addEventListener syntax.
                if (prop.startsWith('onDoc')) {
                    globalDocumentLister = true //event will be attached to the Document instead of the element.
                    listenFor = prop.substring(5).toLowerCase()
                } else {
                    globalDocumentLister = false
                    listenFor = prop.substring(2).toLowerCase()
                }

                // Special case for onScroll. There is no 'scroll' event, but it's intuitive to think so.
                if (listenFor === 'scroll') listenFor = 'wheel' //map onScroll method to onWheel events.

                // Special case for onDrag. onDrag events usually only trigger if draggable property is set in html.
                //  However, the draggable property behaviour is undesirable, so I added a custom drag implementation if method exists without the property.
                if (listenFor === 'drag' && !component._element.draggable) {
                    component._addListener('mousedown', (e) => component._mouseDragStart(e, prop), false, globalDocumentLister)
                    processedMethods.add(prop); // Store method to avoid duplicate listeners.
                    return
                }

                if (!listenFor) {
                    return // ignores on with no event name
                }
                component._addListener(listenFor, (e) => component._event(e, prop), false, globalDocumentLister)
                processedMethods.add(prop); // Store method to avoid duplicate listeners.
            });
            prototype = Object.getPrototypeOf(prototype); // Move up the prototype chain
        }
    }
}
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
                    'onMouseDown', 'onDrag', 'onClick'
                ];
                if (!indexUsages.includes(prop) && commonEventsOnly) {
                    return
                }
                // <<< End of code to ignore.

                let listenFor = prop; //make a copy of the name.

                // Special case for onScroll. There is no 'scroll' event, but it's intuitive to think so.
                if (listenFor === 'onScroll') listenFor = 'onWheel' //map onScroll method to onWheel events.

                //console.log('Handler detected',component.constructor.name + '.' + prop, 'will be executed for', listenFor, 'events.')

                // Special case for onDrag. onDrag events usually only trigger if draggable property is set in html.
                //  However, the draggable property behaviour is undesirable, so I added a custom drag implementation if method exists without the property.
                if (listenFor === 'onDrag' && !component._element.draggable) {
                    component._element.addEventListener('mousedown', (e) => component._mouseDragStart(e, prop), false)
                    processedMethods.add(prop); // Store method to avoid duplicate listeners.
                    return
                }

                //remove the word 'on' from the start to match addEventListener syntax.
                listenFor = listenFor.substring(2).toLowerCase()
                if (!listenFor) {
                    return // ignores on with no event name
                }
                component._addListener(listenFor, (e) => component._event(e, prop), false)
                processedMethods.add(prop); // Store method to avoid duplicate listeners.
            });
            prototype = Object.getPrototypeOf(prototype); // Move up the prototype chain
        }
    }
}
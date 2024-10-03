export default class Text {
    static parse(value) {
        if (typeof value === 'string') return value

        if (value === null || value === undefined || typeof value === 'symbol' || typeof value === 'function') {
            throw new Error('Value is not a valid string.');
        }

        if (typeof value === 'object') {
            // object must have a custom toString method and return a string to be considered valid.
            if (value.toString === Object.prototype.toString || typeof value.toString() !== 'string') {
                throw new Error('Value is an object with an invalid toString method.');
            }
        }

        return value.toString();
    }

    static toCamelCase(text) {
        return text.replace(/-\w/g, Text.clearAndUpper);
    }

    static toPascalCase(text) {
        return text.replace(/(^\w|-\w)/g, Text.clearAndUpper);
    }

    static clearAndUpper(text) {
        return text.replace(/-/, "").toUpperCase();
    }

    static randomId(length = 36, base = Date.now()) {
        let result = base.toString(36).substring(2)
        while (result.length < length) {
            result += Math.random().toString(36).substring(2)
        }
        return result.substring(0, length)
    }
}
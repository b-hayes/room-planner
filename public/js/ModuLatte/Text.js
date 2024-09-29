export default class Text {
    static parse(value) {
        return value.toString()// pretty much anything can be a string already without an error.
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
        //console.log('time part', result)
        while (result.length < length) {
            result += Math.random().toString(36).substring(2)
        }
        return result.substring(0, length)
    }
}
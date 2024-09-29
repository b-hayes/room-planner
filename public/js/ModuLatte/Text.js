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
}
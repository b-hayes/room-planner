export default class String {
    static parse(value) {
        return value.toString()// pretty much anything can be a string already without an error.
    }

    static toCamelCase(text) {
        return text.replace(/-\w/g, String.clearAndUpper);
    }

    static toPascalCase(text) {
        return text.replace(/(^\w|-\w)/g, String.clearAndUpper);
    }

    static clearAndUpper(text) {
        return text.replace(/-/, "").toUpperCase();
    }
}
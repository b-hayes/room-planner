export default class String {
    static parse(value, errorMessage = 'Value must be a string') {
        if (typeof value !== 'string') {
            if (errorMessage === undefined) {
                errorMessage = 'Expected value to be a string ' + typeof value
            }
            throw new Error(errorMessage)
        }
        return value
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
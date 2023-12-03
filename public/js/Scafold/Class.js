export default class Class {

    constructor() {
        console.log('Class')
        console.log('this.constructor', this.constructor)
        console.log('this.constructor.name', this.constructor.name)
        console.log('this.target', this.target)
        for (var key in this.constructor) {
            console.log(key, this.constructor[key])
            // if (this.constructor.hasOwnProperty(key)) {
            //     this[key] = this.constructor[key]
            // }
        }
    }
}

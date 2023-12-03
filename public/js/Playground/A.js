import B from './B.js'
import C from './C.js'

export default class A {
    constructor() {
        console.log('A')
        new B()
        if (typeof C === 'undefined') {
            console.log('C is undefined in A even tho it imports B which imports C')
        }
    }
}

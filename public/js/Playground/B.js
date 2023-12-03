import C from './C.js'

export default class B {
    constructor() {
        console.log('B about to use C')
        new C()
    }
}

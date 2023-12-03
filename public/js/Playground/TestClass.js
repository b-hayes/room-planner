import Class from "../Scafold/Class.js"

export default class TestClass  extends Class {

    testProp = 'im a test prop from the TestClass'

    constructor() {
        console.log('TestClass about to call super()')
        super()
    }
}

import {validate} from '../lib/validator'
import {Field} from '../lib/field-decorator'

describe('IsNumber', () => {
    class NumData {
        @Field({
            type: 'number',
            enum: [1, 2],
            format: 'money',
        })
        num!: number

        @Field({
            type: 'number',
            optional: true,
        })
        numop?: number
    }

    test('validate type', () => {
        let err = validate(NumData, {
            num: 1,
        })
        expect(err).toBeUndefined()

        err = validate(NumData, {num: 3})
        expect(err).toBeDefined()
    })
})

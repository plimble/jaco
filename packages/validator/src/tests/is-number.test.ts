import {validate} from '../lib/validator'
import {Validate} from '../lib/decorators/validate'
import {Schema} from '../lib/decorators/schema'

describe('IsNumber', () => {
    @Validate()
    class NumData {
        @Schema({
            type: 'number',
            enum: [1, 2],
            format: 'money',
        })
        num!: number

        @Schema({
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

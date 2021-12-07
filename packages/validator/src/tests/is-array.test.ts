import {validate} from '../lib/validator'
import {Validate} from '../lib/decorators/validate'
import {Schema} from '../lib/decorators/schema'

describe('IsArray', () => {
    @Validate()
    class ArrayData {
        @Schema({
            type: 'array',
            items: {type: 'string', minLength: 1},
        })
        num!: string[]

        @Schema({
            type: 'array',
            optional: true,
            items: {type: 'string'},
        })
        numop?: string[]
    }

    test('validate required success', () => {
        const err = validate(ArrayData, {
            num: [],
        })
        expect(err).toBeUndefined()
    })

    test('validate required error', () => {
        const err = validate(ArrayData, {})
        expect(err).toBeDefined()
    })

    test('validate empty string error', () => {
        const err = validate(ArrayData, {
            num: [''],
        })
        expect(err).toBeDefined()
    })

    describe('Array class', () => {
        @Validate()
        class ArrayClassNestedData {
            @Schema({type: 'string'})
            name!: string
        }

        @Validate()
        class ArrayClassData {
            @Schema({
                type: 'array',
                items: {type: 'object', ref: ArrayClassNestedData},
                minItems: 1,
            })
            num!: ArrayClassNestedData[]
        }

        test('validate success', () => {
            const err = validate(ArrayClassData, {
                num: [{name: '1'}],
            })
            expect(err).toBeUndefined()
        })

        test('validate error', () => {
            const err = validate(ArrayClassData, {
                num: [{name1: '1'}],
            })
            expect(err).toBeDefined()
        })
    })
})

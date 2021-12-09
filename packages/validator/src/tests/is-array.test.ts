import {validate} from '../lib/validator'
import {Field} from '../lib/field-decorator'

describe('IsArray', () => {
    class ArrayData {
        @Field({
            type: 'array',
            items: {type: 'string', minLength: 1},
        })
        num!: string[]

        @Field({
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
        class ArrayClassNestedData {
            @Field({type: 'string'})
            name!: string
        }

        class ArrayClassData {
            @Field({
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

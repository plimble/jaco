import {validate} from '../lib/validator'
import {Field} from '../lib/field-decorator'

describe('IsString', () => {
    class StrData {
        @Field({type: 'string'})
        num!: string

        @Field({
            type: 'string',
            optional: true,
        })
        numop?: string

        @Field({
            type: 'string',
            optional: true,
            allowEmpty: true,
        })
        allowEmpty?: string
    }

    test('validate required success', () => {
        const err = validate(StrData, {
            num: '1',
        })
        expect(err).toBeUndefined()
    })

    test('validate requred error', () => {
        const err = validate(StrData, {})

        expect(err).toBeDefined()
    })

    test('validate empty error', () => {
        const err = validate(StrData, {num: ''})

        expect(err).toBeDefined()
    })

    test('validate allow empty success', () => {
        const err = validate(StrData, {num: '1', allowEmpty: ''})

        expect(err).toBeUndefined()
    })

    describe('format', () => {
        class StrFormatData {
            @Field({
                type: 'string',
                format: 'date',
            })
            num!: string

            @Field({
                type: 'string',
                format: 'date-time',
            })
            numop!: string
        }

        test('validate format', () => {
            let err = validate(StrFormatData, {
                num: '2018-01-01',
                numop: '2018-01-01T00:00:00.000Z',
            })
            expect(err).toBeUndefined()

            err = validate(StrFormatData, {num: '2018-01-01', numop: ''})
            expect(err).toBeDefined()
        })
    })

    describe('class enum', () => {
        enum StrEnum {
            A = 'a',
            B = 'b',
        }

        class StrEnumData {
            @Field({
                type: 'string',
                enum: ['1', '2'],
            })
            num!: string

            @Field({
                type: 'string',
                enum: StrEnum,
            })
            numop!: string
        }

        test('validate enum', () => {
            let err = validate(StrEnumData, {
                num: '1',
                numop: StrEnum.A,
            })
            expect(err).toBeUndefined()

            err = validate(StrEnumData, {})
            expect(err).toBeDefined()
        })
    })
})

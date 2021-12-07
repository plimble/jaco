import {validate} from '../lib/validator'
import {Validate} from '../lib/decorators/validate'
import {Schema} from '../lib/decorators/schema'

describe('IsString', () => {
    @Validate()
    class StrData {
        @Schema({type: 'string'})
        num!: string

        @Schema({
            type: 'string',
            optional: true,
        })
        numop?: string

        @Schema({
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
        @Validate()
        class StrFormatData {
            @Schema({
                type: 'string',
                format: 'date',
            })
            num!: string

            @Schema({
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

        @Validate()
        class StrEnumData {
            @Schema({
                type: 'string',
                enum: ['1', '2'],
            })
            num!: string

            @Schema({
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

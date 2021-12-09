import {validate} from '../lib/validator'
import {Field} from '../lib/field-decorator'

describe('IsMap', () => {
    describe('Map class', () => {
        class MapClassNestedData {
            @Field({type: 'string'})
            name!: string
        }

        class MapClassData {
            @Field({
                type: 'map',
                value: {type: 'object', ref: MapClassNestedData},
                minProperties: 1,
            })
            num!: Record<string, MapClassNestedData>
        }

        test('validate success', () => {
            const err = validate(MapClassData, {
                num: {hello: {name: '1'}},
            })
            expect(err).toBeUndefined()
        })

        test('validate error', () => {
            const err = validate(MapClassData, {
                num: {},
            })
            expect(err).toBeDefined()
        })

        test('validate invalid type error', () => {
            const err = validate(MapClassData, {
                num: {hello: {name1: '1'}},
            })
            expect(err).toBeDefined()
        })
    })
})

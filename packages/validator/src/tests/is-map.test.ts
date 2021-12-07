import {validate} from '../lib/validator'
import {Validate} from '../lib/decorators/validate'
import {Schema} from '../lib/decorators/schema'

describe('IsMap', () => {
    describe('Map class', () => {
        @Validate()
        class MapClassNestedData {
            @Schema({type: 'string'})
            name!: string
        }

        @Validate()
        class MapClassData {
            @Schema({
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

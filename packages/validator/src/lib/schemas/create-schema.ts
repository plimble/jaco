import {JSONSchemaType} from 'ajv'
import {SchemaOptions} from './options'
import {anySchema} from './any-schema'
import {stringSchema} from './string-schema'
import {objectSchema} from './object-schema'
import {numberSchema} from './number-schema'
import {mapSchema} from './map-schema'
import {booleanSchema} from './boolean-schema'
import {arraySchema} from './array-schema'

export function createSchema(
    target: object | Function,
    key: string,
    options: SchemaOptions,
): Partial<JSONSchemaType<any>> {
    switch (options.type) {
        case 'any':
            return anySchema(options)
        case 'array':
            return arraySchema(target, key, options)
        case 'boolean':
            return booleanSchema(options)
        case 'map':
            return mapSchema(target, key, options)
        case 'number':
            return numberSchema(options)
        case 'object':
            return objectSchema(options)
        case 'string':
            return stringSchema(options)
    }

    return anySchema(options)
}

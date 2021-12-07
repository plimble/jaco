import {JSONSchemaType} from 'ajv'
import {IsArrayOptions} from './options'
import {createSchema} from './create-schema'

export function arraySchema(
    target: object | Function,
    key: string,
    options: IsArrayOptions,
): Partial<JSONSchemaType<any>> {
    return {
        type: 'array',
        items: createSchema(target, key, options.items),
        optional: options.optional,
        description: options.description,
        maxItems: options.maxItems,
        minItems: options.minItems,
        uniqueItems: options.uniqueItems,
    }
}

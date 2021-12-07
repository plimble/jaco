import {JSONSchemaType} from 'ajv'
import {IsMapOptions} from './options'
import {createSchema} from './create-schema'

export function mapSchema(target: object | Function, key: string, options: IsMapOptions): Partial<JSONSchemaType<any>> {
    return {
        type: 'object',
        optional: options.optional,
        description: options.description,
        maxProperties: options.maxProperties,
        minProperties: options.minProperties,
        additionalProperties: createSchema(target, key, options.value) as any,
    }
}

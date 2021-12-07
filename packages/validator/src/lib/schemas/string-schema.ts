import {JSONSchemaType} from 'ajv'
import {IsStringOptions} from './options'

export function stringSchema(options: IsStringOptions): Partial<JSONSchemaType<any>> {
    const schema: Partial<JSONSchemaType<any>> = {
        type: 'string',
        minLength: 1,
    }

    schema.optional = options.optional
    schema.format = options.format
    schema.description = options.description
    schema.enum = options.enum
    schema.maxLength = options.maxLength
    schema.pattern = options.pattern

    if (options.allowEmpty) {
        schema.minLength = undefined
    } else if (options.minLength) {
        schema.minLength = options.minLength
    }

    if (options.enum) {
        if (!(options.enum as any).length) {
            schema.enum = Object.values(options.enum)
            schema.enumClass = options.enum
        }
    }

    return schema
}

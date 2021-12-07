import {JSONSchemaType} from 'ajv'
import {IsAnyOptions} from './options'

export function anySchema(options: IsAnyOptions): Partial<JSONSchemaType<any>> {
    return {
        ...options,
        type: 'null',
    }
}

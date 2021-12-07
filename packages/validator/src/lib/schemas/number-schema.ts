import {JSONSchemaType} from 'ajv'
import {IsNumberOptions} from './options'

export function numberSchema(options: IsNumberOptions): Partial<JSONSchemaType<any>> {
    return options
}

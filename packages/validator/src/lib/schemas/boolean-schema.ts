import {JSONSchemaType} from 'ajv'
import {IsBooleanOptions} from './options'

export function booleanSchema(options: IsBooleanOptions): Partial<JSONSchemaType<any>> {
    return options
}

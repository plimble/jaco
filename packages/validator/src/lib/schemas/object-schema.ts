import {JSONSchemaType} from 'ajv'
import {getMetadataSchema} from '../metadata-storage'
import {IsObjectOptions} from './options'

export function objectSchema(options: IsObjectOptions): Partial<JSONSchemaType<any>> {
    const objectSchema = getMetadataSchema(options.ref)

    return {
        ...objectSchema,
        optional: options.optional,
        description: options.description,
    }
}

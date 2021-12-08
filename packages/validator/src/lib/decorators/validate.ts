import {getMetadataSchema, setMetadataSchema} from '../metadata-storage'

export interface ValidateOptions {
    description?: string
}

export function Validate(options?: ValidateOptions) {
    return (target: object | Function) => {
        const schema = getMetadataSchema(target)
        schema.$id = (target as Function).name
        schema.type = 'object'
        schema.ref = target
        schema.additionalProperties = false
        if (options) {
            schema.description = options.description
        }

        setMetadataSchema(schema, target)
    }
}

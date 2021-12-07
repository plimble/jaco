import {getMetadataSchema, setMetadataSchema} from '../metadata-storage'
import {setRequiredSchema} from '../schemas/set-required-schema'
import {SchemaOptions} from '../schemas/options'
import {createSchema} from '../schemas/create-schema'

export function Schema(options: SchemaOptions) {
    return (target: object | Function, key?: string) => {
        if (!key) return

        const schema = getMetadataSchema(target.constructor)
        schema.properties = schema.properties ?? {}
        schema.properties[key] = createSchema(target, key, options)
        setRequiredSchema(schema, schema.properties[key], key)

        setMetadataSchema(schema, target.constructor)
    }
}

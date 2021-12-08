import {getMetadataSchema} from './metadata-storage'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import {Constructor} from './types'

const ajv = new Ajv({
    strictSchema: false,
    messages: true,
    allErrors: false,
    formats: {money: 'true', timestamp: 'true', decimal: 'true'},
})
addFormats(ajv, ['date', 'date-time', 'uri', 'email'])

export function validate(obj: Constructor<any>, data: Record<string, any>): string | undefined {
    const schema = getMetadataSchema(obj)
    if (!schema) {
        return undefined
    }

    const validate = ajv.compile(schema)

    validate(data)

    if (validate.errors) {
        const err = validate.errors[0]
        if (err.instancePath) {
            return `'${err.instancePath.split('/').pop()}' ${err.message}`
        }

        return err.message
    }

    return undefined
}

export function getSchema(obj: Constructor<any>): Record<string, any> | undefined {
    return getMetadataSchema(obj)
}

import {JSONSchemaType} from 'ajv'

export function setRequiredSchema(
    targetSchema: JSONSchemaType<any>,
    propSchema: JSONSchemaType<any>,
    propName: string,
): void {
    if (!propSchema.optional) {
        if (targetSchema.required) {
            targetSchema.required.push(propName)
        } else {
            targetSchema.required = [propName]
        }
    }
}

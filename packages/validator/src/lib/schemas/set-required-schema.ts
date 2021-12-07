import {JSONSchemaType} from 'ajv'

export function setRequiredSchema(
    targetSchema: Partial<JSONSchemaType<any>>,
    propSchema: Partial<JSONSchemaType<any>>,
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

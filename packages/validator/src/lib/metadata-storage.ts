import 'reflect-metadata'
import {JSONSchemaType} from 'ajv'

const SCHEMA_KEY = Symbol('jaco-validator')

export function getMetadataSchema(target: object | Function): Partial<JSONSchemaType<any>> {
    return Reflect.getOwnMetadata(SCHEMA_KEY, target) || {}
}

export function setMetadataSchema(value: Partial<JSONSchemaType<any>>, target: object | Function) {
    return Reflect.defineMetadata(SCHEMA_KEY, value, target)
}

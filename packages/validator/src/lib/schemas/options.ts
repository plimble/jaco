import {Constructor} from '../types'

interface BaseOptions {
    type: string
    optional?: boolean
    description?: string
    deprecated?: string | boolean
}

export interface IsAnyOptions extends BaseOptions {
    type: 'any'
}

export interface IsArrayOptions extends BaseOptions {
    type: 'array'
    items: SchemaOptions
    maxItems?: number
    minItems?: number
    uniqueItems?: boolean
}

export interface IsBooleanOptions extends BaseOptions {
    type: 'boolean'
}

export interface IsMapOptions extends BaseOptions {
    type: 'map'
    value: SchemaOptions
    maxProperties?: number
    minProperties?: number
}

export interface IsNumberOptions extends BaseOptions {
    type: 'number'
    format?: 'money' | 'timestamp' | 'decimal'
    enum?: number[]
    maximum?: number
    minimum?: number
    exclusiveMaximum?: number
    exclusiveMinimum?: number
    multipleOf?: number
}

export interface IsObjectOptions extends BaseOptions {
    type: 'object'
    ref: Constructor<any>
}

export interface IsStringOptions extends BaseOptions {
    type: 'string'
    allowEmpty?: boolean
    format?: 'date' | 'date-time' | 'uri' | 'email'
    enum?: string[] | object
    maxLength?: number
    minLength?: number
    pattern?: string
}

export type SchemaOptions =
    | IsAnyOptions
    | IsArrayOptions
    | IsBooleanOptions
    | IsMapOptions
    | IsNumberOptions
    | IsObjectOptions
    | IsStringOptions

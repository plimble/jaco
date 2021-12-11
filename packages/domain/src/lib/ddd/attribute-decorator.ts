import 'reflect-metadata'
import {Constructor} from '@onedaycat/jaco-common'

const ATTRIBUTE_KEY = Symbol('jaco:attr')

interface AttributeMetadata {
    props: Record<string | symbol, AttributeInfo>
}

type TransformFn = (value: any) => any

export interface AttributeOptions {
    toModel?: TransformFn
}

export interface AttributeInfo {
    type: 'map' | 'set' | 'array' | 'object' | 'any'
    ref?: Constructor<any>
    options?: AttributeOptions
}

export function Attribute(options?: AttributeOptions): PropertyDecorator {
    return function (target: any, key?: string | symbol) {
        if (!key) return

        const metadata: AttributeMetadata = Reflect.getMetadata(ATTRIBUTE_KEY, target.constructor) ?? {props: {}}
        metadata.props[key] = {type: 'any', options}
        Reflect.defineMetadata(ATTRIBUTE_KEY, metadata, target.constructor)
    }
}

export function MapAttribute(type?: Constructor<any>, options?: AttributeOptions): PropertyDecorator {
    return function (target: any, key?: string | symbol) {
        if (!key) return

        const metadata: AttributeMetadata = Reflect.getMetadata(ATTRIBUTE_KEY, target.constructor) ?? {props: {}}
        metadata.props[key] = {type: 'map', ref: type, options}
        Reflect.defineMetadata(ATTRIBUTE_KEY, metadata, target.constructor)
    }
}

export function SetAttribute(options?: AttributeOptions): PropertyDecorator {
    return function (target: any, key?: string | symbol) {
        if (!key) return

        const metadata: AttributeMetadata = Reflect.getMetadata(ATTRIBUTE_KEY, target.constructor) ?? {props: {}}
        metadata.props[key] = {type: 'set', options}
        Reflect.defineMetadata(ATTRIBUTE_KEY, metadata, target.constructor)
    }
}

export function ArrayAttribute(item?: Constructor<any>, options?: AttributeOptions): PropertyDecorator {
    return function (target: any, key?: string | symbol) {
        if (!key) return

        const metadata: AttributeMetadata = Reflect.getMetadata(ATTRIBUTE_KEY, target.constructor) ?? {props: {}}
        metadata.props[key] = {type: 'array', ref: item, options}
        Reflect.defineMetadata(ATTRIBUTE_KEY, metadata, target.constructor)
    }
}

export function ObjectAttribute(type: Constructor<any>, options?: AttributeOptions): PropertyDecorator {
    return function (target: any, key?: string | symbol) {
        if (!key) return

        const metadata: AttributeMetadata = Reflect.getMetadata(ATTRIBUTE_KEY, target.constructor) ?? {props: {}}
        metadata.props[key] = {type: 'object', ref: type, options}
        Reflect.defineMetadata(ATTRIBUTE_KEY, metadata, target.constructor)
    }
}

export function marshallAttributes(modelClass: Constructor<any>, data: Record<string, any>): Record<string, any> {
    const attrs: Record<string, any> = {}

    const metadata = Reflect.getMetadata(ATTRIBUTE_KEY, modelClass) as AttributeMetadata | undefined
    if (!metadata) throw new Error(`no attribute metadata in ${modelClass.name}}`)

    for (const [key, options] of Object.entries(metadata.props)) {
        attrs[key] = marshall(data[key], options)
    }

    return attrs
}

export function unmarshallAttributes<T>(modelClass: Constructor<T>, data: Record<string, any>): T {
    const metadata = Reflect.getMetadata(ATTRIBUTE_KEY, modelClass) as AttributeMetadata | undefined
    if (!metadata) throw new Error(`no attribute metadata in ${modelClass.name}}`)

    const model = new modelClass()

    for (const [key, val] of Object.entries(data)) {
        model[key] = unmarshall(val, metadata.props[key])
    }

    return model
}

function marshall(value: any, info: AttributeInfo): any {
    switch (info.type) {
        case 'map': {
            if (value == null) return undefined
            const result: Record<string, any> = {}
            for (const [key, val] of value as Map<string, any>) {
                result[key] = info.ref && val != null ? marshallAttributes(info.ref, val) : val
            }

            return result
        }
        case 'set': {
            if (value == null) return undefined
            const result: any[] = []
            for (const val of value as Set<any>) {
                result.push(val)
            }

            return result
        }
        case 'array': {
            if (value == null) return undefined
            const result: any[] = []
            for (const val of value as any[]) {
                result.push(info.ref && val != null ? marshallAttributes(info.ref, val) : val)
            }

            return result
        }
        case 'object': {
            if (value == null) return undefined

            return info.ref ? marshallAttributes(info.ref, value) : value
        }
    }

    return value
}

function unmarshall(value: any, info: AttributeInfo): any {
    const toModel = info.options?.toModel

    switch (info.type) {
        case 'map': {
            if (value == null) return transform(value, toModel)

            const result = new Map<string, any>()
            for (const [key, val] of Object.entries(value)) {
                result.set(
                    key,
                    info.ref && val != null
                        ? unmarshallAttributes(info.ref, transform(val, toModel))
                        : transform(val, toModel),
                )
            }

            return result
        }
        case 'set': {
            if (value == null) return transform(value, toModel)

            const result = new Set<any>()
            for (const val of value as any[]) {
                result.add(transform(val, toModel))
            }

            return result
        }
        case 'array': {
            if (value == null) return transform(value, toModel)

            const result: any[] = []
            for (const val of value as any[]) {
                result.push(
                    info.ref && val != null
                        ? unmarshallAttributes(info.ref, transform(val, toModel))
                        : transform(val, toModel),
                )
            }

            return result
        }
        case 'object': {
            return info.ref && value != null
                ? unmarshallAttributes(info.ref, transform(value, toModel))
                : transform(value, toModel)
        }
    }

    return transform(value, toModel)
}

function transform(val: any, fn?: TransformFn): any {
    if (fn) return fn(val)

    return val
}

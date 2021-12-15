import 'reflect-metadata'
import {Constructor} from '@onedaycat/jaco-common'

const ATTRIBUTE_KEY = Symbol('jaco:attr')

interface AttributeMetadata {
    props: Record<string | symbol, AttributeInfo>
    init?: string
}

type TransformFn = (value: any, data: any) => any

export interface AttributeOptions {
    toModel?: TransformFn
}

export interface AttributeInfo {
    type: 'map' | 'set' | 'array' | 'object' | 'any'
    ref?: Constructor<any>
    union?: UnionConstructor
    options?: AttributeOptions
}

export interface UnionConstructor {
    field: string
    types: Record<string, Constructor<any>>
}

export function Attribute(options?: AttributeOptions): PropertyDecorator {
    return function (target: any, key?: string | symbol) {
        if (!key) return

        const metadata: AttributeMetadata = Reflect.getMetadata(ATTRIBUTE_KEY, target.constructor) ?? {props: {}}
        metadata.props[key] = {type: 'any', options}
        Reflect.defineMetadata(ATTRIBUTE_KEY, metadata, target.constructor)
    }
}

export function Init(): PropertyDecorator {
    return function (target: any, key?: string | symbol) {
        if (!key) return

        const metadata: AttributeMetadata = Reflect.getMetadata(ATTRIBUTE_KEY, target.constructor) ?? {props: {}}
        metadata.init = key as string
        Reflect.defineMetadata(ATTRIBUTE_KEY, metadata, target.constructor)
    }
}

export function MapAttribute(
    type?: Constructor<any> | UnionConstructor,
    options?: AttributeOptions,
): PropertyDecorator {
    return function (target: any, key?: string | symbol) {
        if (!key) return

        const metadata: AttributeMetadata = Reflect.getMetadata(ATTRIBUTE_KEY, target.constructor) ?? {props: {}}
        metadata.props[key] = {type: 'map', options}
        if (type != null) {
            if (typeof type === 'function') {
                metadata.props[key].ref = type
            } else {
                metadata.props[key].union = type
            }
        }
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

export function ArrayAttribute(
    item?: Constructor<any> | UnionConstructor,
    options?: AttributeOptions,
): PropertyDecorator {
    return function (target: any, key?: string | symbol) {
        if (!key) return

        const metadata: AttributeMetadata = Reflect.getMetadata(ATTRIBUTE_KEY, target.constructor) ?? {props: {}}
        metadata.props[key] = {type: 'array', options}
        if (item != null) {
            if (typeof item === 'function') {
                metadata.props[key].ref = item
            } else {
                metadata.props[key].union = item
            }
        }

        Reflect.defineMetadata(ATTRIBUTE_KEY, metadata, target.constructor)
    }
}

export function ObjectAttribute(
    type: Constructor<any> | UnionConstructor,
    options?: AttributeOptions,
): PropertyDecorator {
    return function (target: any, key?: string | symbol) {
        if (!key) return

        const metadata: AttributeMetadata = Reflect.getMetadata(ATTRIBUTE_KEY, target.constructor) ?? {props: {}}
        metadata.props[key] = {type: 'object', options}
        if (type != null) {
            if (typeof type === 'function') {
                metadata.props[key].ref = type
            } else {
                metadata.props[key].union = type
            }
        }

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

    const props: Record<string, any> = {}
    for (const [key, val] of Object.entries(data)) {
        props[key] = unmarshall(data, val, metadata.props[key])
    }

    const model = new modelClass(props)

    if (metadata.init && model[metadata.init] && typeof model[metadata.init] === 'function') {
        model[metadata.init]()
    }

    return model as T
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

function unmarshall(data: any, value: any, info: AttributeInfo): any {
    const toModel = info.options?.toModel

    switch (info.type) {
        case 'map': {
            if (value == null) return transform(data, value, toModel)

            const result = new Map<string, any>()
            for (const [key, val] of Object.entries<any>(value)) {
                if (val == null) {
                    result.set(key, transform(data, val, toModel))
                    continue
                }

                const ref = info.union ? info.union.types[val[info.union.field]] : info.ref ?? undefined

                result.set(
                    key,
                    ref ? unmarshallAttributes(ref, transform(data, val, toModel)) : transform(data, val, toModel),
                )
            }

            return result
        }
        case 'set': {
            if (value == null) return transform(data, value, toModel)

            const result = new Set<any>()
            for (const val of value as any[]) {
                result.add(transform(data, val, toModel))
            }

            return result
        }
        case 'array': {
            if (value == null) return transform(data, value, toModel)

            const result: any[] = []
            for (const val of value as any[]) {
                if (val == null) {
                    result.push(transform(data, val, toModel))
                    continue
                }

                const ref = info.union ? info.union.types[val[info.union.field]] : info.ref ?? undefined

                result.push(
                    ref ? unmarshallAttributes(ref, transform(data, val, toModel)) : transform(data, val, toModel),
                )
            }

            return result
        }
        case 'object': {
            if (value == null) return transform(data, value, toModel)
            const ref = info.union ? info.union.types[value[info.union.field]] : info.ref ?? undefined

            return ref ? unmarshallAttributes(ref, transform(data, value, toModel)) : transform(data, value, toModel)
        }
    }

    return transform(data, value, toModel)
}

function transform(data: any, val: any, fn: TransformFn | undefined): any {
    if (fn) return fn(val, data)

    return val
}

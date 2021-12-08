import {TSDoc, TSDocOptions} from '../helper/ts/ts-doc'
import {Constructor} from '@onedaycat/jaco-common'

export type TypeName =
    | 'enum'
    | 'timestamp'
    | 'money'
    | 'datetime'
    | 'date'
    | 'number'
    | 'decimal'
    | 'string'
    | 'object'
    | 'array'
    | 'map'
    | 'boolean'
    | 'any'

export type TransformType = (type: string) => string

export abstract class BaseType {
    nullable = false
    optional = false
    doc = new TSDoc()
    abstract type: TypeName
    transform?: TransformType

    abstract toNodeType(): string

    abstract toKotlinType(): string

    abstract toSwiftType(): string

    abstract toDartType(): string

    setDoc(options: TSDocOptions): this {
        this.doc.build(options)

        return this
    }

    setNullable(nullable: boolean): this {
        this.nullable = nullable

        return this
    }

    setOptional(optional: boolean): this {
        this.optional = optional

        return this
    }

    setTransformType(transform?: TransformType): this {
        this.transform = transform

        return this
    }

    isType<T extends BaseType>(type: Constructor<T>): this is T {
        return this instanceof type
    }
}

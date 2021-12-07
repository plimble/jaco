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
    public nullable = false
    public optional = false
    public doc = new TSDoc()
    public abstract type: TypeName
    public transform?: TransformType

    public abstract toNodeType(): string

    public abstract toKotlinType(): string

    public abstract toSwiftType(): string

    public abstract toDartType(): string

    public setDoc(options: TSDocOptions): this {
        this.doc.build(options)

        return this
    }

    public setNullable(nullable: boolean): this {
        this.nullable = nullable

        return this
    }

    public setOptional(optional: boolean): this {
        this.optional = optional

        return this
    }

    public setTransformType(transform?: TransformType): this {
        this.transform = transform

        return this
    }

    public isType<T extends BaseType>(type: Constructor<T>): this is T {
        return this instanceof type
    }
}

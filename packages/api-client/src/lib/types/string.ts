import {BaseType, TypeName} from './base'

export class StringType extends BaseType {
    type: TypeName = 'string'
    values?: string[]

    setValues(values?: string[]): this {
        if (values) {
            const vals = values.filter(s => s != null)
            this.values = vals.length ? vals : undefined
        }

        return this
    }

    toKotlinType(): string {
        return this.transform ? this.transform('String') : 'String'
    }

    toNodeType(): string {
        if (this.values) {
            return this.values.map(s => `'${s}'`).join(' | ')
        }

        return this.transform ? this.transform('string') : 'string'
    }

    toSwiftType(): string {
        return this.transform ? this.transform('String') : 'String'
    }

    toDartType(): string {
        return this.transform ? this.transform('String') : 'String'
    }
}

import {BaseType, TypeName} from './base'

export class StringType extends BaseType {
    public type: TypeName = 'string'
    public values?: string[]

    public setValues(values?: string[]): this {
        if (values) {
            const vals = values.filter(s => s != null)
            this.values = vals.length ? vals : undefined
        }

        return this
    }

    public toKotlinType(): string {
        return this.transform ? this.transform('String') : 'String'
    }

    public toNodeType(): string {
        if (this.values) {
            return this.values.map(s => `'${s}'`).join(' | ')
        }

        return this.transform ? this.transform('string') : 'string'
    }

    public toSwiftType(): string {
        return this.transform ? this.transform('String') : 'String'
    }

    public toDartType(): string {
        return this.transform ? this.transform('String') : 'String'
    }
}

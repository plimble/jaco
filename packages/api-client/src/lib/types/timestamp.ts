import {BaseType, TypeName} from './base'

export class TimestampType extends BaseType {
    public type: TypeName = 'timestamp'

    public toKotlinType(): string {
        return this.transform ? this.transform('Long') : 'Long'
    }

    public toNodeType(): string {
        return this.transform ? this.transform('number') : 'number'
    }

    public toSwiftType(): string {
        return this.transform ? this.transform('Int') : 'Int'
    }

    public toDartType(): string {
        return this.transform ? this.transform('int') : 'int'
    }
}

import {BaseType, TypeName} from './base'

export class TimestampType extends BaseType {
    type: TypeName = 'timestamp'

    toKotlinType(): string {
        return this.transform ? this.transform('Long') : 'Long'
    }

    toNodeType(): string {
        return this.transform ? this.transform('number') : 'number'
    }

    toSwiftType(): string {
        return this.transform ? this.transform('Int') : 'Int'
    }

    toDartType(): string {
        return this.transform ? this.transform('int') : 'int'
    }
}

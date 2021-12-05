import {deepClone, deepEqual} from '@onedaycat/jaco-common'

export class ValueObject {
    equal(valueObject: ValueObject): boolean {
        if (this === valueObject) {
            return true
        }

        return deepEqual(this, valueObject)
    }

    clone(): ValueObject {
        return deepClone(this)
    }

    toString(): string {
        return JSON.stringify(this)
    }
}

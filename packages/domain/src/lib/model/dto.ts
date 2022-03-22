import {deepClone, deepEqual, DeepProps} from '@onedaycat/jaco-common'
import {instanceToPlain} from 'class-transformer'

export abstract class Dto {
    clone(): this {
        return deepClone(this)
    }

    equal(obj: Dto): boolean {
        if (this === obj) {
            return true
        }

        return deepEqual(this, obj)
    }

    toObject(): DeepProps<this> {
        return instanceToPlain(this, {excludePrefixes: ['_']}) as any
    }

    toString(): string {
        return JSON.stringify(this.toObject())
    }
}

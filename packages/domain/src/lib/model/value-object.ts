import {deepClone, deepEqual, DeepProps, DeepWriteable} from '@onedaycat/jaco-common'
import produce, {Draft} from 'immer'
import {instanceToPlain} from 'class-transformer'

export abstract class ValueObject {
    clone(): this {
        return deepClone(this)
    }

    equal(obj: ValueObject): boolean {
        if (this === obj) {
            return true
        }

        return deepEqual(this, obj)
    }

    patch(draftFn: (draft: Draft<DeepWriteable<this>>) => any): boolean {
        const props = this.toObject()
        const newProps = produce(props, draftFn)

        if (props !== newProps) {
            Object.assign(this, newProps)

            return true
        }

        return false
    }

    toObject(): DeepProps<this> {
        return instanceToPlain(this, {excludePrefixes: ['_']}) as any
    }

    toString(): string {
        return JSON.stringify(this.toObject())
    }
}

import {deepClone, deepEqual, DeepProps, Props} from '@plimble/jaco-common'
import produce, {Draft} from 'immer'
import {instanceToPlain} from 'class-transformer'

export abstract class Entity {
    abstract readonly id: string

    clone(): this {
        return deepClone(this)
    }

    equal(obj: Entity): boolean {
        if (this === obj) {
            return true
        }

        return deepEqual(this, obj)
    }

    patch(draftFn: (draft: Draft<Props<this>>) => any): boolean {
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

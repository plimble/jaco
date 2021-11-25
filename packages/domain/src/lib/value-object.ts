import produce, {Draft} from 'immer'
import {deepEqual} from '@onedaycat/jaco-common'

export class ValueObject<T> {
    protected state: T

    constructor(state: T) {
        this.state = state
    }

    equal(valueObject: ValueObject<any>): boolean {
        if (this === valueObject) {
            return true
        }

        return deepEqual(this, valueObject)
    }

    patchState(draftFn: (draft: Draft<T>) => any): boolean {
        const newState = produce(this.state, draftFn)

        if (this.state !== newState) {
            this.state = newState

            return true
        }

        return false
    }

    getState(): T {
        return this.state
    }

    toJSON(): T {
        return this.state
    }
}

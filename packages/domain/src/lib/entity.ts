import produce, {Draft} from 'immer'
import {Id} from './id'
import {deepEqual} from '@onedaycat/jaco-common'

export interface EntityState {
    id: Id | string
}

export class Entity<T extends EntityState = EntityState> {
    protected state: T

    constructor(state: T) {
        this.state = state
    }

    getId(): string {
        return this.state.id.toString()
    }

    equal(entity: Entity<any>): boolean {
        if (this === entity) {
            return true
        }

        return deepEqual(this, entity)
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

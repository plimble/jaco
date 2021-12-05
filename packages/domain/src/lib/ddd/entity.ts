import {deepClone, deepEqual} from '@onedaycat/jaco-common'

export abstract class Entity {
    abstract id: string

    equal(entity: Entity): boolean {
        if (this === entity) {
            return true
        }

        return deepEqual(this, entity)
    }

    clone(): Entity {
        return deepClone(this)
    }

    toString(): string {
        return JSON.stringify(this)
    }
}

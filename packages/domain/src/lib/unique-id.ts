import {Id} from './id'
import {IdGen} from '@onedaycat/jaco-common'

export class UniqueId implements Id {
    private readonly id: string

    constructor(id?: string) {
        this.id = id ?? IdGen.generate()
    }

    toString(): string {
        return this.id
    }

    toJSON(): string {
        return this.id
    }
}

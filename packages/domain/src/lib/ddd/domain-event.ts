import {Clock, Constructor} from '@onedaycat/jaco-common'

export interface DomainEventPayload {
    id: string
    type: string
    payload: string
    time: number
}

export class DomainEvent<T = any> {
    static is<T extends DomainEvent>(event: T, target: Constructor<DomainEvent>): event is T {
        return (target as any).TYPE === event.type
    }

    static loadFromPayload<D extends DomainEvent>(payload: DomainEventPayload, seqNumber?: string): D {
        return new DomainEvent(payload.id, payload.type, JSON.parse(payload.payload))
            .setTime(payload.time)
            .setSeqNumber(seqNumber ?? '0') as D
    }

    id: string
    type: string
    payload: T
    time: number
    seqNumber: string

    constructor(id: string, type: string, payload: T) {
        this.id = id
        this.type = type
        this.payload = payload
        this.time = Clock.new()
        this.seqNumber = '0'
    }

    setTime(time: number): this {
        this.time = time

        return this
    }

    setId(id: string): this {
        this.id = id

        return this
    }

    setSeqNumber(seqNumber: string): this {
        this.seqNumber = seqNumber

        return this
    }

    toString(): string {
        return JSON.stringify(this)
    }

    toJSON(): DomainEventPayload {
        return {
            id: this.id,
            type: this.type,
            payload: JSON.stringify(this.payload),
            time: this.time,
        }
    }
}

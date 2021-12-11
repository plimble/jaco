import {Clock, Constructor, IdGen} from '@onedaycat/jaco-common'

export class DomainEvent<T = any> {
    static TYPE = ''

    id: string
    type: string
    payload: T
    time: number

    constructor(type: string, payload: T, id?: string, time?: number) {
        this.id = id ?? IdGen.generate()
        this.time = time ?? Clock.new()
        this.payload = payload
        this.type = type
    }
}

export interface ParsedDomainEvent<T extends DomainEvent = DomainEvent> {
    event: T
    seqNumber: string
}

export function isDomainEvent<T extends DomainEvent>(event: any, domainEvent: Constructor<T>): event is T {
    return event.type === (domainEvent as any).TYPE
}

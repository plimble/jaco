import {DomainEvent} from './domain-event'
import {Constructor, deepClone} from '@onedaycat/jaco-common'

export abstract class Aggregate {
    abstract id: string
    version = 0
    time = 0
    private _events: Array<DomainEvent> = []

    hasChanged(): boolean {
        return this._events.length > 0
    }

    hasEvent(eventClass: Constructor<DomainEvent>): boolean {
        return this._events.some(event => event instanceof eventClass)
    }

    addEvent(event: DomainEvent): void {
        this._events.push(event)
        this.version = this.version + 1
        this.time = event.time
    }

    clearEvents(): void {
        this._events.splice(0, this._events.length)
    }

    getEvents(): DomainEvent[] {
        return this._events
    }

    clone(): Aggregate {
        return deepClone(this)
    }

    toString(): string {
        return JSON.stringify(this)
    }
}

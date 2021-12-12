import {DomainEvent} from './domain-event'
import {deepClone} from '@onedaycat/jaco-common'

export abstract class Aggregate {
    abstract id: string
    private version = 0
    private time = 0
    private _events: Array<DomainEvent> = []

    hasChanged(): boolean {
        return this._events.length > 0
    }

    hasEvent(evetType: string): boolean {
        return this._events.some(event => event.type === evetType)
    }

    addEvent(event: DomainEvent): void {
        this._events.push(event)
        this.version = this.version + 1
        this.time = event.time
    }

    getVersion(): number {
        return this.version
    }

    getTime(): number {
        return this.time
    }

    setVersion(version: number): void {
        this.version = version
    }

    setTime(time: number): void {
        this.time = time
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

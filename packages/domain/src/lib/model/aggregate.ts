import {deepClone, deepEqual, DeepProps, Props} from '@plimble/jaco-common'
import produce, {Draft} from 'immer'
import {instanceToPlain} from 'class-transformer'
import {Message} from './message'

export abstract class Aggregate {
    abstract readonly id: string
    private _version = 0
    private _time = 0
    private _events: Array<Message> = []

    addEvent(event: Message): void {
        this._events.push(event)
        this._version = this._version + 1
        this._time = event.time
    }

    clearEvents(): void {
        this._events.splice(0, this._events.length)
    }

    clone(): this {
        return deepClone(this)
    }

    equal(obj: Aggregate): boolean {
        if (this === obj) {
            return true
        }

        return deepEqual(this, obj)
    }

    getEvents(): Message[] {
        return this._events
    }

    getTime(): number {
        return this._time
    }

    getVersion(): number {
        return this._version
    }

    hasChanged(): boolean {
        return this._events.length > 0
    }

    hasEvent(evetType: string): boolean {
        return this._events.some(event => event.type === evetType)
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

    setTime(time: number): void {
        this._time = time
    }

    setVersion(version: number): void {
        this._version = version
    }

    toObject(): DeepProps<this> {
        return instanceToPlain(this, {excludePrefixes: ['_']}) as any
    }

    toString(): string {
        return JSON.stringify(this.toObject())
    }
}

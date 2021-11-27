import {container} from '@onedaycat/jaco-common'
import {DependencyContainer} from 'tsyringe'
import {Req} from './req'

export const REQUEST_CONTEXT = 'v:req'

export class Context {
    private data: any = {}

    getRequest<T = any>(): Readonly<Req<T>> {
        return this.data[REQUEST_CONTEXT]
    }

    getContainer(): DependencyContainer {
        return container
    }

    setData<T>(sym: symbol | string, data: T): void {
        this.data[sym] = data
    }

    getData<T>(sym: symbol | string): T {
        return this.data[sym]
    }
}

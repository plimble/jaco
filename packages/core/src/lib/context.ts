import {container} from '@plimble/jaco-common'
import {DependencyContainer} from 'tsyringe'
import {HttpReq, Req} from './req'

export const REQUEST_CONTEXT = 'v:req'

export class Context {
    private data: any = {}

    getContainer(): DependencyContainer {
        return container
    }

    getData<T>(sym: symbol | string): T {
        return this.data[sym]
    }

    getHttpRequest<T = any>(): Readonly<HttpReq<T>> {
        return this.data[REQUEST_CONTEXT]
    }

    getRequest<T = any>(): Readonly<Req<T>> {
        return this.data[REQUEST_CONTEXT]
    }

    setData<T>(sym: symbol | string, data: T): void {
        this.data[sym] = data
    }
}

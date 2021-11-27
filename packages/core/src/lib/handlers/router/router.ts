import {Constructor} from '@onedaycat/jaco-common'
import Route from 'url-router'
import {Controller} from './controller'

export type ImportPromise = () => Promise<Constructor<Controller>>
export type ResourceFn = (r: ApiRouter) => void
export type RouteResult<T> = {
    handler: T
    params: Record<string, string>
}

export class ApiRouter {
    private readonly route: Route<ImportPromise>
    private readonly name: string

    constructor(route?: Route<ImportPromise>, name?: string) {
        if (!route) {
            this.route = new Route()
        } else {
            this.route = route
        }
        if (!name) {
            this.name = ''
        } else {
            this.name = name
        }
    }

    resource(name: string, fn: ResourceFn): this {
        const router = new ApiRouter(this.route, `${this.name}/${name}`)
        fn(router)

        return this
    }

    get(path: string, ctrlImport: ImportPromise): this {
        this.route.add(this.createPath('GET', path), ctrlImport)

        return this
    }

    post(path: string, ctrlImport: ImportPromise): this {
        this.route.add(this.createPath('POST', path), ctrlImport)

        return this
    }

    put(path: string, ctrlImport: ImportPromise): this {
        this.route.add(this.createPath('PUT', path), ctrlImport)

        return this
    }

    patch(path: string, ctrlImport: ImportPromise): this {
        this.route.add(this.createPath('PATCH', path), ctrlImport)

        return this
    }

    delete(path: string, ctrlImport: ImportPromise): this {
        this.route.add(this.createPath('DELETE', path), ctrlImport)

        return this
    }

    getRoute(method: string, path: string): RouteResult<ImportPromise> | undefined {
        const result = this.route.find(`${method} ${path}`)
        if (!result) return undefined

        return result
    }

    private createPath(method: string, path: string): string {
        return `${method} ${this.name}/${path}`
    }
}

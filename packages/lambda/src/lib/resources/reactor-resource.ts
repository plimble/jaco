import {LambdaOptions} from './lambda-options'
import {Constructor} from '@plimble/jaco-common'

export type ReactorResourceFn = (env: string) => ReactorResourceOptions

export interface ReactorResourceOptions {
    name: string
    messages: string[] | Array<{messages: string[]}>
    enable?: boolean
    lambdaOptions?: LambdaOptions
}

const REACTOR_KEY = Symbol('jaco:reactor')

export function ReactorResource(fn: ReactorResourceFn): ClassDecorator {
    return function (target: any) {
        Reflect.defineMetadata(REACTOR_KEY, fn(process.env.JACO_ENV ?? 'dev'), target)
    }
}

export function getReactorResource(reactorClass: Constructor<any>): ReactorResourceOptions | undefined {
    return Reflect.getMetadata(REACTOR_KEY, reactorClass)
}

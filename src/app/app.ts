import type {Context as LambdaContext} from 'aws-lambda/handler'
import {Constructor} from '../common/types'
import {Middleware} from './middleware'
import {Context} from './context'

export function handler(app: App) {
    return async (event: unknown, context: LambdaContext): Promise<any> => {
        return await app.handle(event, new Context(context))
    }
}

export class App {
    private globalMiddlewares: Array<Middleware | Constructor<Middleware>> = []

    async handle(event: unknown, context: Context): Promise<any> {
        
    }
}

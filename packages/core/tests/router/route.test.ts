import {AppError, MethodNotFound, Singleton} from '@plimble/jaco-common'
import {Api, ApiRouter, App, Context, Controller, HttpReq, HttpRes, RouterHandler} from '../../src/index'
import {Field} from '@plimble/jaco-validator'

class Input {
    @Field({type: 'string'})
    id = ''

    @Field({type: 'string'})
    name = ''
}

@Api({
    input: Input,
    output: Input,
    description: 'Test',
})
@Singleton()
class Ctrl implements Controller {
    async handle(input: Input, context: Context): Promise<HttpRes> {
        return {body: input}
    }
}

describe('Route', () => {
    const router = new ApiRouter()

    router.resource('user', r => {
        r.get(':id', () => Promise.resolve(Ctrl))
        r.get(':id/name', () => Promise.resolve(Ctrl as any))
    })

    router.get(':id', () => Promise.resolve(Ctrl))

    const app = new App({
        handler: new RouterHandler(router),
    })

    test('should be able to get route #1', async () => {
        const result = await app.invoke<HttpReq>({
            method: 'GET',
            path: '/user/1',
            payload: {name: 'hello'},
        })

        expect(result).toEqual<HttpRes>({
            body: {id: '1', name: 'hello'},
        })
    })

    test('should be able to get route #2', async () => {
        const result = await app.invoke<HttpReq>({
            method: 'GET',
            path: '/1',
            payload: {name: 'hello'},
        })

        expect(result).toEqual({
            body: {id: '1', name: 'hello'},
        })
    })

    test('should be able to get route #3', async () => {
        const result = await app.invoke<HttpReq>({
            method: 'GET',
            path: '/user/1/name',
            payload: {name: 'hello'},
        })
        expect(result).toEqual({
            body: {id: '1', name: 'hello'},
        })
    })

    test('should be not found route', async () => {
        const result = await app.invoke<HttpReq>({
            method: 'GET',
            path: '/user/1/name/2',
            payload: {name: 'hello'},
        })

        expect(result).toEqual(new AppError(MethodNotFound))
    })
})

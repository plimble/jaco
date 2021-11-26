import {ApiPayload, ApiResponse, Context, Controller, createApiApp, Router} from '@onedaycat/jaco'
import {MethodNotFound, Singleton} from '@onedaycat/jaco-common'

@Singleton()
class Ctrl extends Controller {
    async handle(body: any, context: Context): Promise<ApiResponse> {
        return {body}
    }
}

describe('Route', () => {
    const router = new Router()

    router.resource('user', r => {
        r.get(':id', () => Promise.resolve(Ctrl))
        r.get(':id/name', () => Promise.resolve(Ctrl as any))
    })

    router.get(':id', () => Promise.resolve(Ctrl))

    const app = createApiApp(router)

    test('should be able to get route #1', async () => {
        const result = await app.invoke<ApiPayload>({
            payload: {
                method: 'GET',
                path: '/user/1',
                body: {name: 'hello'},
            },
        })
        expect(result).toEqual({
            body: JSON.stringify({name: 'hello', id: '1'}),
            headers: {
                'Content-Type': 'application/json',
            },
            statusCode: 200,
        })
    })

    test('should be able to get route #2', async () => {
        const result = await app.invoke<ApiPayload>({
            payload: {
                method: 'GET',
                path: '/1',
                body: {name: 'hello'},
            },
        })
        expect(result).toEqual({
            body: JSON.stringify({name: 'hello', id: '1'}),
            headers: {
                'Content-Type': 'application/json',
            },
            statusCode: 200,
        })
    })

    test('should be able to get route #3', async () => {
        const result = await app.invoke<ApiPayload>({
            payload: {
                method: 'GET',
                path: '/user/1/name',
                body: {name: 'hello'},
            },
        })
        expect(result).toEqual({
            body: JSON.stringify({name: 'hello', id: '1'}),
            headers: {
                'Content-Type': 'application/json',
            },
            statusCode: 200,
        })
    })

    test('should be not found route', async () => {
        const result = await app.invoke<ApiPayload>({
            payload: {
                method: 'GET',
                path: '/user/1/name/2',
                body: {name: 'hello'},
            },
        })
        expect(result).toEqual({
            body: JSON.stringify(new MethodNotFound().toErrorPayload()),
            headers: {
                'Content-Type': 'application/json',
            },
            statusCode: 404,
        })
    })
})

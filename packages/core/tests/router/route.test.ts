import {MethodNotFound, Singleton} from '@onedaycat/jaco-common'
import {IsString} from 'class-validator'
import {Api, ApiPayload, ApiResponse, ApiRouter, Context, Controller, createApiApp, FieldInfo} from '../../src/index'

class Input {
    @IsString()
    @FieldInfo({
        description: 'id',
    })
    id = ''

    @IsString()
    @FieldInfo({
        description: 'name',
    })
    name = ''
}

@Api({
    input: Input,
    output: Input,
    description: 'Test',
})
@Singleton()
class Ctrl extends Controller {
    async handle(input: Input, context: Context): Promise<ApiResponse> {
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
            body: JSON.stringify({id: '1', name: 'hello'}),
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
            body: JSON.stringify({id: '1', name: 'hello'}),
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
            body: JSON.stringify({id: '1', name: 'hello'}),
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

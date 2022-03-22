import {App, Context} from '@onedaycat/jaco-core'
import {AppError, wrapError} from '@onedaycat/jaco-common'
import {Context as LambdaContext} from 'aws-lambda'
import {EventResolver} from './event-parsers/resolve-event-parser'

export interface LambdaOptions {
    resolver: EventResolver
}

export function handler(
    app: App,
    options?: Partial<LambdaOptions>,
): (event: any, context: LambdaContext) => Promise<any> {
    const opts = {
        resolver: new EventResolver(),
    }

    if (options) {
        Object.assign(opts, options)
    }

    return async (event: any, context: LambdaContext): Promise<any> => {
        const parser = opts.resolver.resolve(event)

        try {
            const timeout = (context.getRemainingTimeInMillis() - 3) * 1000
            const result = await app.invokeWithTimeout<any>(
                {
                    requestId: context.awsRequestId,
                    functionName: context.functionName,
                    timeout: timeout > 0 ? timeout : undefined,
                    payload: parser.parseRequest(event),
                    raw: event,
                },
                new Context(),
            )

            if (result instanceof AppError) {
                return Promise.reject(parser.parseErrorResponse(result))
            }

            return parser.parseResponse(result)
        } catch (e) {
            const err = wrapError(e)

            return Promise.reject(parser.parseErrorResponse(err))
        }
    }
}

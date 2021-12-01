import 'reflect-metadata'
import {AppError, Constructor, container, TimeoutError, wrapError} from '@onedaycat/jaco-common'
import {Handler} from './handler'
import {EventParser} from './event-parser'
import {Middleware, Next} from './middleware'
import {ErrorHandler} from './error-handler'
import {RawEventParser} from './event-parsers/raw-event-parser'
import {Req} from './req'
import {Context, REQUEST_CONTEXT} from './context'

export interface AppOptions {
    handler: Handler | Constructor<Handler>
    eventParser?: Constructor<EventParser>
}

export class App {
    static handler(app: App): any {
        return async (event: any, context: any): Promise<any> => {
            try {
                const timeout = (context.getRemainingTimeInMillis() - 3) * 1000

                return await app.invokeWithTimeout(
                    {
                        functionName: context.functionName,
                        timeout: timeout > 0 ? timeout : 0,
                        payload: undefined,
                        raw: event,
                    },
                    new Context(),
                )
            } catch (e) {
                const err = wrapError(e)

                return {
                    errorType: err.code,
                    errorMessage: err.message,
                    trace: err.stack,
                }
            }
        }
    }

    private readonly handler: Handler
    private readonly eventParser: EventParser
    private readonly middlewares: Array<Constructor<Middleware>> = []
    private cacheMiddlewares?: Middleware[]
    private cacheErrors?: ErrorHandler[]
    private readonly errorHandlers: Constructor<ErrorHandler>[] = []

    constructor(options: AppOptions) {
        if ((options.handler as Handler).handle) {
            this.handler = options.handler as Handler
        } else {
            this.handler = container.resolve(options.handler as Constructor<Handler>)
        }

        if (options.eventParser) {
            this.eventParser = container.resolve(options.eventParser)
        } else {
            this.eventParser = new RawEventParser()
        }
    }

    useMiddlewares(...middlewares: Array<Constructor<Middleware>>): void {
        this.middlewares.push(...middlewares)
    }

    useErrorHandlers(...errorHandlers: Array<Constructor<ErrorHandler>>): void {
        this.errorHandlers.push(...errorHandlers)
    }

    async invokeWithTimeout<T>(req: Req<T>, context: Context): Promise<T> {
        if (!req.timeout) {
            return this.invoke(req, context)
        }

        const timeout = new Promise(resolve => {
            setTimeout(() => resolve(new TimeoutError()), req.timeout)
        })

        const result = await Promise.race<any>([this.invoke(req, context), timeout])
        if (result instanceof TimeoutError) {
            const err = await this.handleErrors(result, context)

            return this.eventParser.parseErrorResponse(err, context)
        }

        return result
    }

    async invoke<T>(req: Req<T>, context?: Context): Promise<T> {
        if (!context) context = new Context()
        if (req.raw) {
            try {
                req.payload = await this.eventParser.parseRequest(req.raw, context)
            } catch (e) {
                const err = await this.handleErrors(wrapError(e), context)

                return this.eventParser.onParseRequestError(err, context)
            }
        }
        context.setData<Req>(REQUEST_CONTEXT, req)

        const result = await this.run(req, context)
        if (result instanceof AppError) {
            return this.eventParser.parseErrorResponse(result, context)
        }

        try {
            return this.eventParser.parseResponse(result, context)
        } catch (e) {
            const err = await this.handleErrors(wrapError(e), context)

            return this.eventParser.parseErrorResponse(err, context)
        }
    }

    private async run(req: Req, context: Context): Promise<any> {
        try {
            const mdws = this.getMiddlewares()
            if (mdws.length) {
                return await mdws[0].use(req, context, this.next(mdws, context, req, 1))
            } else {
                return await this.handler.handle(req.payload, context)
            }
        } catch (e) {
            return await this.handleErrors(wrapError(e), context)
        }
    }

    private next(middlewareList: Array<Middleware>, context: Context, req: Req, index: number): Next {
        if (middlewareList.length === index) {
            return this.handler.handle(req, context)
        }

        return middlewareList[index].use(req, context, this.next(middlewareList, context, req, index + 1))
    }

    private async handleErrors(err: AppError, context: Context): Promise<AppError> {
        try {
            const errHandlers = this.getErrorHandlers()
            for (const errHandler of errHandlers) {
                await errHandler.handle(err, context)
            }

            return err
        } catch (e) {
            return wrapError(e)
        }
    }

    private getMiddlewares(): Middleware[] {
        if (this.cacheMiddlewares) {
            return this.cacheMiddlewares
        }

        const mdws: Middleware[] = []
        for (const mdw of this.middlewares) {
            mdws.push(container.resolve<Middleware>(mdw))
        }

        this.cacheMiddlewares = mdws

        return mdws
    }

    private getErrorHandlers(): ErrorHandler[] {
        if (this.cacheErrors) {
            return this.cacheErrors
        }

        const errHandlers: ErrorHandler[] = []
        for (const errHandler of this.errorHandlers) {
            errHandlers.push(container.resolve<ErrorHandler>(errHandler))
        }

        this.cacheErrors = errHandlers

        return errHandlers
    }
}

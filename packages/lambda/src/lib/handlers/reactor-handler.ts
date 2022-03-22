import {AppError, Constructor, wrapError} from '@onedaycat/jaco-common'
import {Context, Handler} from '@onedaycat/jaco-core'

export interface ReactorSetup {
    reactor: Constructor<Reactor>
    events: string[]
}

export interface Reactor {
    maxRetry?: number
    retryDelay?: number
    beforeAllReact?: (events: any, context: Context) => Promise<void>
    onErrorBeforeAllReact?: (events: any, err: AppError, context: Context) => Promise<void>
    beforeReact?: (event: any, context: Context) => Promise<void>
    afterReacted?: (event: any, context: Context) => Promise<void>
    onError?: (event: any, err: AppError, context: Context) => Promise<void>
    afterAllReacted?: (events: any, context: Context) => Promise<void>
    onErrorAfterAllReacted?: (events: any, err: AppError, context: Context) => Promise<void>
    react(event: any, context: Context): Promise<void>
}

async function handleError(
    reactor: Reactor,
    onError: keyof Reactor,
    err: AppError,
    event: any,
    context: Context,
): Promise<void> {
    try {
        await (reactor[onError] as any)(event, err, context)
    } catch (e: any) {
        throw wrapError(e)
    }
}

async function handleErrorAll(
    reactor: Reactor,
    onError: keyof Reactor,
    err: AppError,
    events: any,
    context: Context,
): Promise<void> {
    try {
        await (reactor[onError] as any)(events, err, context)
    } catch (e: any) {
        throw wrapError(e)
    }
}

export class ReactorHandler implements Handler {
    constructor(private eventSetups: ReactorSetup[]) {}

    async handle(events: any, context: Context): Promise<void> {
        const container = context.getContainer()

        try {
            for (const setup of this.eventSetups) {
                const filteredEvents = events.filter(e => setup.events.includes(e.type))

                if (filteredEvents.length) {
                    const react = container.resolve(setup.reactor)

                    await this.handleReact(react, filteredEvents, context)
                }
            }
        } catch (e) {
            throw wrapError(e)
        }
    }

    protected async handleReact(reactor: Reactor, events: any, context: Context): Promise<void> {
        if (reactor.beforeAllReact) {
            try {
                await reactor.beforeAllReact(events, context)
            } catch (e) {
                const err = wrapError(e)
                if (reactor.onErrorBeforeAllReact) {
                    await handleErrorAll(reactor, 'onErrorBeforeAllReact', err, events, context)
                }

                throw err
            }
        }

        for (const event of events) {
            try {
                if (reactor.beforeReact) {
                    await reactor.beforeReact(event, context)
                }

                await reactor.react(event, context)

                if (reactor.afterReacted) {
                    await reactor.afterReacted(event, context)
                }
            } catch (e) {
                const err = wrapError(e).withInput(event.toJSON())

                if (reactor.onError) {
                    await handleError(reactor, 'onError', err, event, context)
                }

                throw err
            }
        }

        if (reactor.afterAllReacted) {
            try {
                await reactor.afterAllReacted(events, context)
            } catch (e) {
                const err = wrapError(e)
                if (reactor.onErrorAfterAllReacted) {
                    await handleErrorAll(reactor, 'onErrorAfterAllReacted', err, events, context)
                }

                throw err
            }
        }
    }
}

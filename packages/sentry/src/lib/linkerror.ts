import {addGlobalEventProcessor, getCurrentHub} from '@sentry/core'
import {getExceptionFromError} from '@sentry/node/dist/parsers'
import {
    Event as SentryEvent,
    EventHint as SentryEventHint,
    Exception as SentryException,
    ExtendedError,
    Integration,
    StackFrame,
} from '@sentry/types'
import {AppError} from '@onedaycat/jaco-common'

const DEFAULT_KEY = 'cause'
const DEFAULT_LIMIT = 5

export interface LinkErrorOptions {
    key?: string
    limit?: number
    rewriteFrame?: boolean
    rewritePath?: string
    rewriteTag?: string
}

export class LinkedErrors implements Integration {
    static id = 'LinkedErrors'

    readonly name = LinkedErrors.id

    private readonly key: string

    private readonly limit: number

    private readonly rewriteFrame?: boolean

    private readonly rewritePath?: string

    private readonly rewriteTag?: string

    constructor(options: LinkErrorOptions = {}) {
        this.key = options.key || DEFAULT_KEY
        this.limit = options.limit || DEFAULT_LIMIT
        this.rewriteFrame = options.rewriteFrame
        this.rewritePath = options.rewritePath
        this.rewriteTag = options.rewriteTag
    }

    setupOnce(): void {
        addGlobalEventProcessor(async (event: SentryEvent, hint?: SentryEventHint) => {
            const self = getCurrentHub().getIntegration(LinkedErrors)
            if (self) {
                return self.handler(event, hint)
            }

            return event
        })
    }

    async handler(event: SentryEvent, hint?: SentryEventHint): Promise<SentryEvent | null> {
        const tags = event.tags as any
        event.release = tags.release
        event.logger = tags.service
        if (!event.exception || !event.exception.values || !hint || !(hint.originalException instanceof Error)) {
            return event
        }

        if (!event.contexts) {
            event.contexts = {}
        }

        const linkedErrors = await this.walkErrorTree(1, hint.originalException, this.key, event)
        event.exception.values.push(...linkedErrors)
        event.exception.values.reverse()

        // RewriteFrame
        if (this.rewriteFrame) {
            this.rewrite(event)
        }

        return event
    }

    async walkErrorTree(
        index: number,
        error: ExtendedError,
        key: string,
        event: any,
        stack: SentryException[] = [],
    ): Promise<SentryException[]> {
        this.addInput(error, event.contexts, index, event)
        event.culprit = error.message
        if (!(error[key] instanceof Error) || stack.length >= this.limit) {
            return stack
        }
        const exception = await getExceptionFromError(error[key])

        return this.walkErrorTree(index + 1, error[key], key, event, [...stack, exception])
    }

    addInput(error: Error, contexts: any, index: number, event: any): void {
        if (error instanceof AppError && error.input) {
            if (!contexts[`${error.code}_${index}`]) {
                event.extra[`${error.code}_${index}`] = JSON.stringify(error.input, null, 2)
            }
        }
    }

    private rewrite(event: SentryEvent): void {
        const exception = event.exception

        if (exception) {
            exception.values?.forEach(val => {
                if (val.stacktrace && val.stacktrace.frames) {
                    val.stacktrace.frames.forEach((frame, i, frames) => {
                        frames[i] = this.iteratee(frames[i])
                    })
                }
            })
        } else if (event.stacktrace) {
            if (event.stacktrace.frames) {
                event.stacktrace.frames.forEach((frame, i, frames) => {
                    frames[i] = this.iteratee(frames[i])
                })
            }
        }
    }

    private iteratee(frame: StackFrame): StackFrame {
        if (!frame.filename) return frame
        if (!frame.filename.startsWith('/')) return frame
        if (frame.filename.includes('/node_modules/')) return frame
        if (!process.env.AWS_LAMBDA_FUNCTION_NAME) return frame

        // const functionName = process.env.AWS_LAMBDA_FUNCTION_NAME.replace(/^.+-([^-]+)$/g, '$1')
        if (this.rewritePath != null) {
            frame.filename = frame.filename.replace('/var/task', this.rewritePath)
        }

        return frame
    }
}

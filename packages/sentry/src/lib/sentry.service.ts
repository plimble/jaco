import * as Sentry from '@sentry/node'
import {LinkedErrors, LinkErrorOptions} from './linkerror'
import {AppError, Singleton} from '@onedaycat/jaco-common'

export type SentryEnv = 'production' | 'development'

export interface SentryServiceOptions {
    dsn: string
    release: string
    env: SentryEnv
    tracesSampleRate?: number
    maxBreadcrumbs?: number
    linkError?: LinkErrorOptions
}

export interface SentryPayload {
    functionName: string
    error: AppError
    requestPayload?: string
    user?: {
        id: string
        email: string
    }
}

@Singleton()
export class SentryService {
    private readonly env: SentryEnv
    private readonly release: string

    constructor(options: SentryServiceOptions) {
        this.env = options.env
        this.release = options.release

        Sentry.init({
            dsn: options.dsn,
            release: options.release,
            environment: options.env,
            tracesSampleRate: options.tracesSampleRate ?? 0,
            maxBreadcrumbs: options.maxBreadcrumbs ?? 0,
            integrations: [new LinkedErrors(options.linkError)],
        })
    }

    async sendError(payload: SentryPayload): Promise<void> {
        Sentry.configureScope(scope => {
            scope.setTag('service', payload.functionName)
            scope.setTag('environment', this.env)
            scope.setTag('release', this.release)
            if (payload.requestPayload) {
                scope.setExtra('request', payload.requestPayload)
            }

            if (payload.user) {
                scope.setUser({
                    id: payload.user.id,
                    email: payload.user.email,
                })
            }
        })

        Sentry.captureException(payload.error)

        await Sentry.close()
        //await Sentry.flush(milisec)
    }
}

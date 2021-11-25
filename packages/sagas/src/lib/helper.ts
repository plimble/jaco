import {StateResult} from './interfaces'

export function removeSagasErrorStack<S = any>(result: StateResult<S>): void {
    if (result.lastError) {
        result.lastError.stack = undefined
        if (result.lastError.cause) {
            result.lastError.cause.stack = undefined
        }
    }

    for (const step of result.steps) {
        if (step.error) {
            step.error.stack = undefined
            if (step.error.cause) {
                step.error.cause.stack = undefined
            }
        }
    }
}

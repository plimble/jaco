import {Action, Status} from './constants'
import {AppError, AppErrorPayload} from '@onedaycat/jaco-common'

export interface Step {
    run(state: StepAction): Promise<void>
    compensate(state: CompensateAction): Promise<void>
}

export interface StepStatus {
    name: string
    action: string
    status: string
    time: number
    error?: AppErrorPayload
}

export interface CompensateAction<I = any, S = any> {
    back(): void
    end(): void
    fatal(error: AppError): void
    getStash(): S
    setStash(stash: S): void
    getInput(): Readonly<I>
}

export interface StepAction<I = any, S = any> {
    next(): void
    error(error: AppError, compensateCurrentStep?: boolean): void
    fatal(error: AppError): void
    end(): void
    getStash(): S
    setStash(stash: S): void
    getInput(): Readonly<I>
}

export interface StateResult<I = any, S = any> {
    input: I
    steps: StepStatus[]
    lastError?: AppErrorPayload
    lastStatus: Status
    lastAction: Action
    stash: S
    compensate: boolean
    startTime: number
    endTime: number
}

export interface SagaResult<I, S> {
    failed?: AppError
    state: StateResult<I, S>
}

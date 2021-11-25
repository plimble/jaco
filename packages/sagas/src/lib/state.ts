import {CompensateAction, StateResult, Step, StepAction} from './interfaces'
import {Action, Status} from './constants'
import DependencyContainer from 'tsyringe/dist/typings/types/dependency-container'
import {AppError, Clock, Constructor} from '@onedaycat/jaco-common'

export class State<I, S> implements StepAction<I, S>, CompensateAction<I, S> {
    result: StateResult<I, S>
    lastError?: AppError
    compError?: AppError

    private curStep: Step | undefined
    private curstepIndex = 0
    private curError?: AppError
    private curStatus: Status = Status.INIT
    private curAction: Action = Action.NONE

    constructor(
        private steps: Array<Constructor<Step>>,
        private container: DependencyContainer,
        input: any,
        initStash: any,
    ) {
        this.result = {
            input,
            steps: [],
            lastStatus: Status.INIT,
            lastAction: Action.NONE,
            compensate: false,
            startTime: Clock.new(),
            endTime: 0,
            stash: initStash,
        }

        this.curstepIndex = 0
        this.curStep = this.container.resolve<Step>(this.steps[0])
    }

    getCurStep(): Step | undefined {
        return this.curStep
    }

    next(): void {
        if (this.curstepIndex === this.steps.length - 1) {
            return this.end()
        }

        this.result.steps.push({
            name: (this.curStep as any).constructor.name,
            action: Action.NEXT,
            status: Status.SUCCESS,
            time: Clock.new(),
        })
        this.lastError = undefined
        this.result.lastError = undefined
        this.result.lastStatus = Status.SUCCESS
        this.result.lastAction = Action.NEXT

        this.curAction = Action.NEXT
        this.curStatus = Status.SUCCESS
        this.curError = undefined
        this.curstepIndex += 1
        this.curStep = this.container.resolve<Step>(this.steps[this.curstepIndex])
    }

    error(error: AppError, compensateThisStep?: boolean): void {
        const errJson = error.toJSON()
        this.result.steps.push({
            name: (this.curStep as any).constructor.name,
            action: Action.COMPENSATE,
            status: Status.ERROR,
            time: Clock.new(),
            error: errJson,
        })
        this.compError = error
        this.lastError = error
        this.result.lastError = errJson
        this.result.lastStatus = Status.ERROR
        this.result.lastAction = Action.COMPENSATE
        this.result.compensate = true

        this.curAction = Action.COMPENSATE
        this.curStatus = Status.ERROR
        this.curError = error
        if (!compensateThisStep) {
            this.curstepIndex -= 1
            if (this.curstepIndex >= 0) {
                this.curStep = this.container.resolve<Step>(this.steps[this.curstepIndex])
            } else {
                this.curStep = undefined
            }
        }
    }

    fatal(error: AppError): void {
        const errJson = error.toJSON()
        this.result.steps.push({
            name: (this.curStep as any).constructor.name,
            action: Action.END,
            status: Status.ERROR,
            time: Clock.new(),
            error: errJson,
        })
        this.lastError = error
        this.result.lastError = errJson
        this.result.lastStatus = Status.ERROR
        this.result.lastAction = Action.END

        this.curAction = Action.END
        this.curStatus = Status.ERROR
        this.curError = error
        this.curstepIndex = -1
        this.curStep = undefined
    }

    back(): void {
        if (this.curstepIndex <= 0) {
            return this.end()
        }

        this.result.steps.push({
            name: (this.curStep as any).constructor.name,
            action: Action.BACK,
            status: Status.SUCCESS,
            time: Clock.new(),
        })
        this.lastError = undefined
        this.result.lastError = undefined
        this.result.lastStatus = Status.SUCCESS
        this.result.lastAction = Action.BACK
        this.result.compensate = true

        this.curAction = Action.BACK
        this.curStatus = Status.SUCCESS
        this.curError = undefined
        this.curstepIndex -= 1
        if (this.curstepIndex >= 0) {
            this.curStep = this.container.resolve<Step>(this.steps[this.curstepIndex])
        } else {
            this.curStep = undefined
        }
    }

    end(): void {
        const status = this.result.compensate ? Status.COMPENSATED : Status.SUCCESS
        this.result.steps.push({
            name: (this.curStep as any).constructor.name,
            action: Action.END,
            status,
            time: Clock.new(),
        })

        this.lastError = undefined
        this.result.lastError = undefined
        this.result.lastStatus = status
        this.result.lastAction = Action.END

        this.curAction = Action.END
        this.curStatus = status
        this.curError = undefined
        this.curstepIndex = -1
        this.curStep = undefined
    }

    getStash(): S {
        return this.result.stash
    }

    setStash(stash: S): void {
        this.result.stash = stash
    }

    getInput(): Readonly<I> {
        return this.result.input
    }
}

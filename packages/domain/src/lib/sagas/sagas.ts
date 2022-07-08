import {SagaResult, Step} from './interfaces'
import {State} from './state'
import {container} from 'tsyringe'
import {Constructor, deepClone, wrapError} from '@plimble/jaco-common'

export abstract class Sagas<I, S> {
    protected abstract initStash: any
    protected abstract steps: Array<Constructor<Step>>

    async start(input: I): Promise<SagaResult<I, S>> {
        const state = new State(this.steps, container, input, deepClone(this.initStash))

        let step: Step | undefined
        step = state.getCurStep()
        while (step) {
            step = state.getCurStep()
            if (!step) {
                break
            }

            try {
                if (!state.result.compensate) {
                    await step.run(state)
                } else {
                    await step.compensate(state)
                }
            } catch (e) {
                if (!state.result.compensate) {
                    state.error(wrapError(e))
                } else {
                    state.fatal(wrapError(e))
                }
            }
        }

        state.result.endTime = state.result.steps[state.result.steps.length - 1].time

        return {
            failed: state.lastError ?? state.compError,
            state: state.result,
        } as SagaResult<I, S>
    }
}

import produce, {Draft} from 'immer'

export function patchState<T = any>(fromState: T, draftFn: (draft: Draft<any>) => any): [T, boolean] {
    const newState = produce(fromState, draftFn)
    if (fromState !== newState) {
        return [newState, true]
    }

    return [fromState, false]
}

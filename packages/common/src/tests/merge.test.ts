import {patchState} from '@onedaycat/jaco-common'

interface Data {
    a?: number
    b?: string
    c?: string
    d?: any[]
    e?: any
}

describe('Immutable Patch', () => {
    test('patchState changed', () => {
        const base: Data = {
            a: 1,
            e: {x: {c: 1}},
        }

        const [newState, changed] = patchState(base, draft => {
            draft.e.x.c = 2
        })
        expect(changed).toBeTruthy()
        expect(newState).toEqual({a: 1, e: {x: {c: 2}}})
    })

    test('patchState changed override', () => {
        const base: Data = {
            a: 1,
            e: {x: {c: 1}},
        }

        const [newState, changed] = patchState(base, draft => {
            draft.e = {x: {c: 2}}
        })
        expect(changed).toBeTruthy()
        expect(newState).toEqual({a: 1, e: {x: {c: 2}}})
    })

    test('patchState not changed', () => {
        const base: Data = {
            a: 1,
            e: {x: {c: 1}},
        }

        const [newState, changed] = patchState(base, draft => {
            draft.e.x.c = 1
        })
        expect(changed).toBeFalsy()
        expect(newState).toEqual({a: 1, e: {x: {c: 1}}})
    })

    test('patchState not changed return undefined', () => {
        const base: Data = {
            a: 1,
            e: {x: {c: 1}},
        }

        const [newState, changed] = patchState(base, () => {
            return undefined
        })
        expect(changed).toBeFalsy()
        expect(newState).toEqual({a: 1, e: {x: {c: 1}}})
    })
})

import {AppError} from '../lib/app-error'

describe('AppError', () => {
    const e1 = () => [404, 'e1']
    const e2 = () => [500, 'e2']
    const e3 = () => [500, 'e3']

    describe('AppError.is', () => {
        test('found error', () => {
            const err2 = new AppError(e2)
            const err = new AppError(e1).withCause(e2)

            expect(err.is(err)).toBeTruthy()
            expect(err.is(e1)).toBeTruthy()
            expect(err.is(err2)).toBeTruthy()
            expect(err.is(e2)).toBeTruthy()
            expect(err2.is(err.cause)).toBeTruthy()
        })

        test('not found error', () => {
            const err2 = new AppError(e2)
            const err = new AppError(e1).withCause(err2)

            expect(err.is(e3)).toBeFalsy()
            expect(err2.is(err)).toBeFalsy()
            expect(err2.is(e1)).toBeFalsy()
        })
    })

    describe('InstanceOf', () => {
        const err1 = new AppError(e1)
        const err2 = new Error('')

        expect(err1).toBeInstanceOf(AppError)
        expect(err2).not.toBeInstanceOf(AppError)
    })
})

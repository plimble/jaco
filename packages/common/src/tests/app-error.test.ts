import {AppError, registerError} from '../lib/app-error'

describe('AppError', () => {
    const errs = registerError({
        e1: [500, 'e1'],
        e2: [500, 'e2'],
    })

    describe('AppError.is', () => {
        test('found error', () => {
            const err2 = new AppError(errs.e2)
            const err = new AppError(errs.e1).withCause(err2)

            expect(err.is(err)).toBeTruthy()
            expect(err.is(errs.e1)).toBeTruthy()
            expect(err.is(err2)).toBeTruthy()
            expect(err.is(errs.e2)).toBeTruthy()
        })

        test('not found error', () => {
            const err2 = new AppError(errs.e2)
            const err = new AppError(errs.e1).withCause(err2)

            expect(err.is(err2)).toBeTruthy()
            expect(err.is(errs.e2)).toBeTruthy()
        })
    })

    describe('AppError.is', () => {
        test('is not equal exception', () => {
            const err = new AppError(errs.e1)
            const err2 = new AppError(errs.e2)
            expect(err.is(err2)).toBeFalsy()
            expect(err.is(errs.e2)).toBeFalsy()
        })

        test('is equal exception', () => {
            const err = new AppError(errs.e1)
            const err2 = new AppError(errs.e1)
            expect(err.is(err2)).toBeTruthy()
            expect(err.is(errs.e1)).toBeTruthy()
        })
    })
})

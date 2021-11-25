import {AppError, isError, registerError} from '../lib/app-error'

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

    describe('isError', () => {
        class CustomError extends Error {
            constructor(name: string, message: string) {
                super(message)
                this.name = name
            }
        }

        test('isError', () => {
            const err = new AppError(errs.e1)
            expect(isError(err, errs.e1)).toBeTruthy()
            expect(isError(err, 'e1')).toBeTruthy()
            expect(isError(err, errs.e2)).toBeFalsy()

            const customErr = new CustomError('e1', 'e1')
            expect(isError(customErr, errs.e1)).toBeFalsy()
            expect(isError(customErr, 'e1')).toBeFalsy()
            expect(isError(customErr, errs.e2)).toBeFalsy()
            expect(isError(customErr, 'CustomError')).toBeFalsy()
        })
    })

    describe('instanceof from AppErrorInfo', () => {
        test('isError', () => {
            const err = new AppError(errs.e1)
            expect(err).toBeInstanceOf(AppError)
            expect(err).toBeInstanceOf(Error)
            expect(err.is(errs.e1)).toBeTruthy()
            expect(err.is(errs.e2)).toBeFalsy()
        })
    })
})

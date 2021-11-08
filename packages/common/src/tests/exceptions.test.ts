import {ExceptionCode, exceptions, HttpException, isException} from '@onedaycat/jaco-common'

describe('Exceptions', () => {
    const errs = exceptions({
        e1: {status: 500, code: 'e1', msg: 'e1'},
        e2: {status: 500, code: 'e2', msg: 'e2'},
    })

    describe('HttpException.hasError', () => {
        test('found error', () => {
            const err2 = HttpException.create(errs.e2)
            const err = HttpException.create(errs.e1).withCause(err2)

            expect(err.hasError(err)).toBeTruthy()
            expect(err.hasError(errs.e1)).toBeTruthy()
            expect(err.hasError(err2)).toBeTruthy()
            expect(err.hasError(errs.e2)).toBeTruthy()
        })

        test('not found error', () => {
            const err2 = HttpException.create(errs.e2)
            const err = HttpException.create(errs.e1).withCause(err2)

            expect(err.hasError(err2)).toBeTruthy()
            expect(err.hasError(errs.e2)).toBeTruthy()
        })
    })

    describe('built in exceptions', () => {
        test('method not found', () => {
            const err = HttpException
                .fromCode(ExceptionCode.MethodNotFound)
                .withMessage('err')
            expect(err.code).toEqual('MethodNotFound')
            expect(err.status).toEqual(404)
            expect(err.message).toEqual('err')
        })
    })

    describe('HttpException.is', () => {
        test('is not equal exception', () => {
            const err = HttpException.create(errs.e1)
            const err2 = HttpException.create(errs.e2)
            expect(err.is(err2)).toBeFalsy()
            expect(err.is(errs.e2)).toBeFalsy()
        })

        test('is equal exception', () => {
            const err = HttpException.create(errs.e1)
            const err2 = HttpException.create(errs.e1)
            expect(err.is(err2)).toBeTruthy()
            expect(err.is(errs.e1)).toBeTruthy()
        })
    })

    describe('isException', () => {
        test('is not HttpException', () => {
            expect(isException(new Error())).toBeFalsy()
        })

        test('isException without code', () => {
            const err = HttpException.create(errs.e1)
            let result = false

            if (isException(err)) {
                result = err.code != null
            }

            expect(result).toBeTruthy()
        })

        test('isException with code', () => {
            const err = HttpException.create(errs.e1)
            let result = false

            if (isException(err, errs.e1.code)) {
                result = err.code != null
            }

            expect(result).toBeTruthy()
        })
    })
})

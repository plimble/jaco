import SpyInstance = jest.SpyInstance
import {Constructor} from './types'

type FunctionPropertyNames<T> = {[K in keyof T]: T[K] extends (...args: any[]) => any ? K : never}[keyof T] & string
type ArgsType<T> = T extends (...args: infer A) => any ? A : never

export const mocked = {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    create<T>(_token?: Constructor<T>): T {
        return {} as any
    },
    // eslint-disable-next-line @typescript-eslint/ban-types
    spyOn<T extends {}, M extends FunctionPropertyNames<Required<T>>>(
        object: T,
        method: M,
    ): Required<T>[M] extends (...args: any[]) => any
        ? SpyInstance<ReturnType<Required<T>[M]>, ArgsType<Required<T>[M]>>
        : never {
        object[method] = new Function() as any

        return jest.spyOn(object, method as any) as any
    },
    clear(mock: any): void {
        for (const key of Object.keys(mock)) {
            if (mock[key].mockRestore) {
                mock[key].mockRestore()
            }
        }
    },
    reset(mock: any): void {
        for (const key of Object.keys(mock)) {
            if (mock[key].mockClear) {
                mock[key].mockClear()
            }
        }
    },
}

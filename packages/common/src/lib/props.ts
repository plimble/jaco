export type Func = (...args: any[]) => any
type IsFunction<T> = T extends Func ? true : false

type ValueType = string | number | boolean | null | undefined | Func | Set<any> | Map<any, any> | Date | Array<any>

type ExcludeFuncsFromObj<T> = Pick<T, {[K in keyof T]: IsFunction<T[K]> extends true ? never : K}[keyof T]>

export type Props<T> = {
    [K in keyof ExcludeFuncsFromObj<T>]: T[K]
}

export type DeepProps<T> = {
    [K in keyof ExcludeFuncsFromObj<T>]: T[K] extends ValueType ? T[K] : Props<T[K]>
}

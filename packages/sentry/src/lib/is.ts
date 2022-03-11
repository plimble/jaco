/**
 * Checks whether given value has a then function.
 * @param wat A value to be checked.
 */
export function isThenable(wat: any): boolean {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return Boolean(wat && wat.then && typeof wat.then === 'function')
}

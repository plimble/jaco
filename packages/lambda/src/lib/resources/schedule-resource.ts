import {LambdaOptions} from './lambda-options'
import {Constructor} from '@onedaycat/jaco-common'

export type ScheduleResourceFn = (env: string) => ScheduleResourceOptions

export interface ScheduleResourceOptions {
    name: string
    cronSchedule: string
    enable?: boolean
    lambdaOptions?: LambdaOptions
}

const SCHEDULE_KEY = Symbol('jaco:schedule')

export function ScheduleResource(fn: ScheduleResourceFn): ClassDecorator {
    return function (target: any) {
        Reflect.defineMetadata(SCHEDULE_KEY, fn(process.env.JACO_ENV ?? 'dev'), target)
    }
}

export function getScheduleResource(scheduleClass: Constructor<any>): ScheduleResourceOptions | undefined {
    return Reflect.getMetadata(SCHEDULE_KEY, scheduleClass)
}

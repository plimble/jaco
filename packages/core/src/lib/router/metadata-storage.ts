import {ApiInfo} from './controller'

export const CTRL_KEY = Symbol('jaco:ctrl')

export function getMetadataApi(target: any): ApiInfo | undefined {
    return Reflect.getOwnMetadata(CTRL_KEY, target)
}

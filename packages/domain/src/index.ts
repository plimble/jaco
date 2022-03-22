import {setAutoFreeze} from 'immer'

setAutoFreeze(false)

export * from './lib/model/aggregate'
export * from './lib/model/entity'
export * from './lib/model/message'
export * from './lib/model/value-object'
export * from './lib/repo/dynamodb'

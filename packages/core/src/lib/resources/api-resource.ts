import {LambdaOptions} from './lambda-options'
import {Constructor} from '@onedaycat/jaco-common'

export type ApiResourceFn = (env: string) => ApiResourceOptions

export interface ApiResourceOptions {
    name: string
    noAuthRoutes?: string[]
    jwt?: ApiJWTResource
    cors?: ApiCorsConfig
    lambdaOptions?: LambdaOptions
    timeoutMilliseconds?: number
    stages?: string[]
    customDomain?: ApiCustomDomainResource
}

export interface ApiCustomDomainResource {
    // domain name hosted zone in route53
    route53ZoneDomain: string
    apigwDomainName: string
    apigwZoneId: string
    domainName: string
    stages?: ApiCustomDomainStageResource[]
}

export interface ApiCustomDomainStageResource {
    prefix: string
    name: string
}

export interface ApiJWTResource {
    audiences: string[]
    issuer: string
}

export interface ApiCorsConfig {
    origins?: string[]
    methods?: Array<'GET' | 'POST' | 'OPTIONS' | 'DELETE' | 'PUT' | 'PATCH'>
    maxAge?: number
    headers?: string[]
}

const API_KEY = Symbol('jaco:api')

export function ApiResource(fn: ApiResourceFn): ClassDecorator {
    return function (target: any) {
        Reflect.defineMetadata(API_KEY, fn(process.env.JACO_ENV ?? 'dev'), target)
    }
}

export function getApiResource(apiClass: Constructor<any>): ApiResourceOptions | undefined {
    return Reflect.getMetadata(API_KEY, apiClass)
}

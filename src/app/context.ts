import type {Context as LambdaContext} from 'aws-lambda/handler'
import {container, DependencyContainer} from 'tsyringe'

export class Context {
    readonly functionName: string
    readonly functionVersion: string
    readonly invokedFunctionArn: string
    readonly memoryLimitInMB: string
    readonly awsRequestId: string

    constructor(lambdaContext?: LambdaContext) {
        if (lambdaContext) {
            this.functionName = lambdaContext.functionName
            this.functionVersion = lambdaContext.functionVersion
            this.invokedFunctionArn = lambdaContext.invokedFunctionArn
            this.memoryLimitInMB = lambdaContext.memoryLimitInMB
            this.awsRequestId = lambdaContext.awsRequestId
        } else {
            this.functionName = ''
            this.functionVersion = ''
            this.invokedFunctionArn = ''
            this.memoryLimitInMB = ''
            this.awsRequestId = ''
        }
    }

    getContainer(): DependencyContainer {
        return container
    }
}

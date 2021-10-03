export class QueueEvent<T> {
    readonly seqNumber: number
    readonly payload: T

    // readonly raw: APIGatewayProxyEventV2

    constructor(lambdaEvent: any) {
        this.parse(lambdaEvent)
    }

    private parse(lambdaEvent: any): T {
        // Kinesis
        if (lambdaEvent.Records && lambdaEvent.Records.length && lambdaEvent.Records[0].kinesis) {
            return this.parseKiesis(input)
        }

        // DDB
        if (input.Records && input.Records.length && input.Records[0].dynamodb) {
            return this.parseDdb(input)
        }

        // SNS
        if (input.Records && input.Records.length && input.Records[0].Sns) {
            return this.parseSns(input)
        }

        // SQS
        if (input.Records && input.Records.length && input.Records[0].body && input.Records[0].messageId) {
            return this.parseSqs(input)
        }

        // CloudWatch Schedule
        if (input.scheduled) {
            return this.parseSchedule(input)
        }

        if (Array.isArray(input) && input.length && (input[0] instanceof DomainEvent)) {
            return input
        }

        // DomainEvent payload list
        if (Array.isArray(input) && input.length && input[0].id && input[0].payload && input[0].type) {
            return this.parseDomainEventPayload(input)
        }

        throw new InternalErrorException().withMessage('Unable to parse domain event').withInput(input)
    }
}

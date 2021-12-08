import {EnumType, ObjectType} from './types'
import {ApiSchema} from './parse-router'
import {TypeParser} from './type-parser'

export class ApiTypeParser {
    input?: ObjectType
    output?: ObjectType

    inputObjects = new Map<string, ObjectType>()
    inputEnums = new Map<string, EnumType>()

    outputObjects = new Map<string, ObjectType>()
    outputEnums = new Map<string, EnumType>()

    constructor(apiSchema: ApiSchema) {
        if (apiSchema.inputSchema) {
            const inputSchema = new TypeParser(apiSchema.inputSchema)
            this.input = inputSchema.root
            for (const [name, type] of inputSchema.objects) {
                this.inputObjects.set(name, type)
            }

            for (const [name, type] of inputSchema.enums) {
                this.inputEnums.set(name, type)
            }
        }

        if (apiSchema.outputSchema) {
            const outputSchema = new TypeParser(apiSchema.outputSchema)
            this.input = outputSchema.root
            for (const [name, type] of outputSchema.objects) {
                this.outputObjects.set(name, type)
            }

            for (const [name, type] of outputSchema.enums) {
                this.outputEnums.set(name, type)
            }
        }
    }
}

import {EnumType, ObjectType} from './types'
import {ApiSchema} from './parse-router'
import {ApiTypeParser} from './api-type-parser'

export class GlobalTypeParser {
    inputs = new Map<string, ObjectType>()
    outputs = new Map<string, ObjectType>()

    inputObjects = new Map<string, ObjectType>()
    inputEnums = new Map<string, EnumType>()

    outputObjects = new Map<string, ObjectType>()
    outputEnums = new Map<string, EnumType>()

    constructor(apiSchemas: ApiSchema[]) {
        for (const apiSchema of apiSchemas) {
            const apiParsed = new ApiTypeParser(apiSchema)
            if (apiParsed.input) {
                this.inputs.set(apiParsed.input.name, apiParsed.input)

                for (const [name, type] of apiParsed.inputObjects) {
                    this.inputObjects.set(name, type)
                }

                for (const [name, type] of apiParsed.inputEnums) {
                    this.inputEnums.set(name, type)
                }
            }

            if (apiParsed.output) {
                this.outputs.set(apiParsed.output.name, apiParsed.output)

                for (const [name, type] of apiParsed.outputObjects) {
                    this.outputObjects.set(name, type)
                }

                for (const [name, type] of apiParsed.outputEnums) {
                    this.outputEnums.set(name, type)
                }
            }
        }
    }
}

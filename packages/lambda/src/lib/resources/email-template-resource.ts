import {Constructor} from '@plimble/jaco-common'

export type EmailTemplateResourceFn = (env: string) => EmailTemplateResourceOptions

export interface EmailTemplateResourceOptions {
    name: string
    subject: string
    template: string
}

const EMAIL_KEY = Symbol('jaco:email')

export function EmailTemplateResource(fn: EmailTemplateResourceFn): ClassDecorator {
    return function (target: any) {
        Reflect.defineMetadata(EMAIL_KEY, fn(process.env.JACO_ENV ?? 'dev'), target)
    }
}

export function getEmailTemplateResource(emailTplClass: Constructor<any>): EmailTemplateResourceOptions | undefined {
    return Reflect.getMetadata(EMAIL_KEY, emailTplClass)
}

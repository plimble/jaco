import SES, {BulkEmailDestination} from 'aws-sdk/clients/ses'
import {InternalError, Singleton} from '@onedaycat/jaco-common'

export interface Recipient {
    email: string
    data: Record<string, string>
}

@Singleton()
export class SESX {
    client: SES

    constructor(client?: SES) {
        if (client) {
            this.client = client
        } else {
            this.client = new SES({
                maxRetries: 5,
            })
        }
    }

    async sendWithTemplate(from: string, templateName: string, recipient: Recipient): Promise<void> {
        const params: SES.Types.SendTemplatedEmailRequest = {
            Source: from,
            Destination: {
                ToAddresses: [recipient.email],
            },
            Template: templateName,
            TemplateData: JSON.stringify(recipient.data),
        }

        try {
            await this.client.sendTemplatedEmail(params).promise()
        } catch (e) {
            throw new InternalError().withCause(e).withInput(params)
        }
    }

    async bulkSendWithTemplate(from: string, templateName: string, recipients: Recipient[]): Promise<void> {
        const dest = recipients.map<BulkEmailDestination>(r => {
            return {
                Destination: {ToAddresses: [r.email]},
                ReplacementTemplateData: JSON.stringify(r.data),
            }
        })

        const params: SES.Types.SendBulkTemplatedEmailRequest = {
            Source: from,
            Template: templateName,
            Destinations: dest,
        }

        try {
            await this.client.sendBulkTemplatedEmail(params).promise()
        } catch (e) {
            throw new InternalError().withCause(e).withInput(params)
        }
    }
}

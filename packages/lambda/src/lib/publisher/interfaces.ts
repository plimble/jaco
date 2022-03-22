import {Message} from './message'

export interface ClientPublisher {
    publish(messages: Array<Message>): Promise<void>
}

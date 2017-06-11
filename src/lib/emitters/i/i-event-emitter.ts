import * as Rx from 'rxjs';

export interface IEventEmitter<EventTypes extends { [key: string]: any }> {
    emit<Event extends keyof EventTypes>(type: Event, data: EventTypes[Event]): void;
    on<Event extends keyof EventTypes>(type: Event, fn: (value: EventTypes[Event]) => any): Rx.Subscription;
}
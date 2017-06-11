import * as Rx from 'rxjs';
import { IEventEmitter } from './i';

export class EventEmitter<EventTypes extends { [key: string]: any }> implements IEventEmitter<EventTypes> {
    subjects: { [key: string]: Rx.Subject<any> } = {};

    emit<Event extends keyof EventTypes>(type: Event, data: EventTypes[Event]): void {
        this.subjects[type] || (this.subjects[type] = new Rx.Subject<EventTypes[Event]>());
        this.subjects[type].next(data);
    }

    on<Event extends keyof EventTypes>(type: Event, fn: (value: EventTypes[Event]) => any): Rx.Subscription {
        this.subjects[type] || (this.subjects[type] = new Rx.Subject<EventTypes[Event]>());
        return this.subjects[type].subscribe(fn);
    }
}
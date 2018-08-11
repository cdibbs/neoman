import * as Rx from 'rxjs';

export interface IEventEmitter<ET extends { [key: string]: any }> {
    emit<EK extends keyof ET>(type: EK, data: ET[EK]): void;
    on<EK extends keyof ET>(type: EK, fn: (value: ET[EK]) => any): Rx.Subscription;
}
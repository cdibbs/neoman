import { IClient } from "./i-client";

export interface IClientFactory {
    build(
        resolve: (value?: {} | PromiseLike<{}>) => void,
        reject: (reason?: any) => void
    ): IClient;
}
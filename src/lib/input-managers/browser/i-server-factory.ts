import { IServer } from "./i-server";

export interface IServerFactory {
    build(
        resolve: (value?: {} | PromiseLike<{}>) => void,
        reject: (reason?: any) => void
    ): IServer;
}
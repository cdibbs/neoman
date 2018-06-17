import { Server as HttpServer } from "http";
import { IWebSocket } from "./i-websocket";

export interface IWebSocketFactory {
    buildAndBind(
        server: HttpServer,
        resolve: (value?: {} | PromiseLike<{}>) => void,
        reject: (reason?: any) => void
    ): IWebSocket;
}
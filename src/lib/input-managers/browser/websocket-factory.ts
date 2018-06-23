import { Server as HttpServer } from "http";
import { inject, injectable } from "inversify";
import TYPES from "../../di/types";
import { IUserMessager } from "../../i";
import { IWebSocket } from "./i-websocket";
import { WebSocket } from "./websocket";

@injectable()
export class WebSocketFactory {
    constructor(
        @inject(TYPES.UserMessager) protected msg: IUserMessager
    ) {
    }
    
    public build(
        server: HttpServer,
        resolve: (value?: {} | PromiseLike<{}>) => void,
        reject: (reason?: any) => void
    ): IWebSocket {
        const socket = new WebSocket(this.msg, resolve, reject);
        socket.initialize(server);
        return socket;
    }
}
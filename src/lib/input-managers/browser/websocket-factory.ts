import { IUserMessager } from "../../i";
import { WebSocket } from "./websocket";
import { Server as HttpServer } from "http";
import { IWebSocket } from "./i-websocket";

export class WebSocketFactory {
    constructor(
        protected msg: IUserMessager
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
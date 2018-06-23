import { Server as WebSocketServer, ServerOptions } from "ws";
import { Server as HttpServer } from "http";
import { IUserMessager } from "../../i";
import { curry } from "../../util/curry";
import { IWebSocket } from "./i-websocket";
import { injectable } from "inversify";

@injectable()
export class WebSocket implements IWebSocket {
    protected ws: { new(opts: ServerOptions): WebSocketServer } = WebSocketServer;
    protected wss: WebSocketServer;
    constructor(
        protected msg: IUserMessager,
        protected resolve: (value?: {} | PromiseLike<{}>) => void,
        protected reject: (reason?: any) => void
    ) {

    }

    public initialize(httpServerInstance: HttpServer): void {
        this.wss = new this.ws({ server: httpServerInstance });
        this.wss.on('connection', curry.bindOnly(this.wssConnection, this));
    }

    protected wssConnection(
        ws: any,
        req: any): void
    {
        this.msg.i18n().debug("Connected to browser, awaiting user input...");
        ws.on('message', curry.bindOnly(this.wssMessage, this));
    }

    protected wssMessage(msgString: any): void {
        try {
            let message: any = JSON.parse(msgString);
            if (message && message.eventType) {
                switch(message.eventType) {
                    case "unload":
                        this.reject("User closed browser.");
                        break;
                    case "load":
                        this.msg.i18n().debug("WebSocket established.");
                        break;
                    default:
                        this.msg.i18n({eventType: message.eventType}).warn("Didn't understand wss event type: ${eventType}.");
                }
            } else {
                this.msg.i18n({msgString}).warn("Didn't understand wss message format: {msgString}.");
            }
        } catch (err) {
            this.msg.warn(err);
        }
    }
}
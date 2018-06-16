import { IUserMessager } from "../../i";
import { IServer } from "./i-server";
import { Server } from "./server";
import { IServerFactory } from "./i-server-factory";
import { injectable, inject } from "inversify";
import TYPES from "../../di/types";
import { IWebSocketFactory } from ".";

@injectable()
export class ServerFactory implements IServerFactory{
    constructor(
        @inject(TYPES.UserMessager) protected msg: IUserMessager,
        @inject(TYPES.BIMWebSocketFactory) protected wsFactory: IWebSocketFactory
    ) {
    }

    build(
        resolve: (value?: {} | PromiseLike<{}>) => void,
        reject: (reason?: any) => void
    ): IServer {
        return new Server(this.wsFactory, this.msg, resolve, reject);
    }
}
import { IUserMessager } from "../../i";
import { IClient } from "./i-client";
import { Client } from "./client";
import { IClientFactory } from "./i-client-factory";
import { injectable, inject } from "inversify";
import TYPES from "../../di/types";

@injectable()
export class ClientFactory implements IClientFactory {
    constructor(
        @inject(TYPES.UserMessager) protected msg: IUserMessager
    ) {}

    build(
        resolve: (value?: {} | PromiseLike<{}>) => void,
        reject: (reason?: any) => void
    ): IClient {
        return new Client(this.msg, resolve, reject);
    }
}
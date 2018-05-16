import { inject, injectable } from "inversify";
import TYPES from "../../di/types";
import { IPath, IUserMessager } from "../../i";
import { IInputConfig } from "../../i/template";
import { IDuplexer } from "./i-duplexer";
import { IClient } from "./i-client";
import { IServer } from "./i-server";
import { IServerFactory } from "./i-server-factory";
import { IClientFactory } from "./i-client-factory";

@injectable()
export class Duplexer implements IDuplexer {
    server: IServer;
    client: IClient;
    constructor(
        @inject(TYPES.UserMessager) protected msg: IUserMessager,
        @inject(TYPES.Path) protected path: IPath,
        @inject(TYPES.BIMServerFactory) protected serverFactory: IServerFactory,
        @inject(TYPES.BIMClientFactory) protected clientFactory: IClientFactory
    ) {}

    async getAnswers(inputConfig: IInputConfig): Promise<{ [key: string]: any }> {
        return new Promise((resolve, reject) => {
            this.server = this.serverFactory.build(resolve, reject);
            this.client = this.clientFactory.build(resolve, reject);
            const path = this.path.join(__dirname, '..', '..', 'browser-prompt');
            this.server.launch(path, inputConfig, this.client);
        });
    }

    stop(): void {
        if (this.server) {
            this.server.stop();
        }
        if (this.client) {
            this.client.stop();
        }
    }
}
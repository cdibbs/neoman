import { inject, injectable } from "inversify";
import TYPES from "../../di/types";
import { IPath, IUserMessager } from "../../i";
import { IInputConfig } from "../../i/template";
import { Client } from "./client";
import { IDuplexer } from "./i-duplexer";
import { Server } from "./server";

@injectable()
export class Duplexer implements IDuplexer {
    server: Server;
    client: Client;
    constructor(
        @inject(TYPES.UserMessager) protected msg: IUserMessager,
        @inject(TYPES.Path) protected path: IPath
    ) {}

    async getAnswers(inputConfig: IInputConfig): Promise<{ [key: string]: any }> {
        return new Promise((resolve, reject) => {
            this.server = new Server(this.msg, resolve, reject);
            this.client = new Client(this.msg, resolve, reject);
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
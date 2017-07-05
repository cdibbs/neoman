import { injectable, inject } from 'inversify';
import * as express from 'express';
import * as http from 'http';
import * as WebSocket from 'ws';
import * as bodyParser from 'body-parser';
import * as launch from 'launchpad';
import TYPES from '../di/types';

import * as i from '../i';
import * as it from '../i/template';

@injectable()
export class BrowserInputManager implements i.IInputManager {
    browserInstance: launch.Instance;
    serverInstance: http.Server;

    constructor(
        @inject(TYPES.UserMessager) protected msg: i.IUserMessager,
        @inject(TYPES.Path) private path: i.IPath,
    ) {}

    ask(config: it.IInputConfig): Promise<{ [key: string]: any }> {
        let answers = {};
        let promise = null;
        this.msg.write("Launching browser... please answer template questions and close.");

        promise = new Promise((resolve: (value?: {} | PromiseLike<{}>) => void, reject: (reason?: any) => void) => {
            let httpServer: http.Server;
            let wss: WebSocket.Server;

            var app = express();
            app.use(bodyParser.json());
            app.use('/', express.static(this.path.join(__dirname, '..', 'browser-prompt')));
            app.get('/questions', (req, res) => res.json(config));
            app.post('/', this.handleUserInput.bind(this, resolve, reject));
            this.serverInstance = app.listen(3638, this.launchBrowser.bind(this, reject));
            wss = new WebSocket.Server({ server: this.serverInstance });
            wss.on('connection', this.wssConnection.bind(this, resolve, reject));
        });

        return promise || new Promise(resolve => resolve({}));
    }

    handleUserInput(
        resolve: (value?: {} | PromiseLike<{}>) => void,
        reject: (reason?: any) => void,
        req: express.Request,
        res: express.Response)
    {
        try {
            resolve(req.body);
        } catch(err) {
            reject(err);
        } finally {
            this.browserInstance.stop(() => {});
            this.serverInstance.close();
        }
    }

    launchBrowser(reject: (error?: any) => void): void {
        let self = this;
        launch.local(function(error, launcher) {
            if (error) {
                reject(error);
            } else {
                launcher("http://localhost:3638", <launch.LaunchOptions>{ browser: "chrome", args: "--new-window" }, function(error, inst) {
                    if (error) {
                        reject(error);
                    } else {
                        self.browserInstance = inst;
                    }
                });
            }
        });
    }

    wssConnection(
        resolve: (value?: {} | PromiseLike<{}>) => void,
        reject: (reason?: any) => void,
        ws: any,
        req: any): void
    {
        this.msg.debug("Connected to browser, awaiting user input...");
        ws.on('message', this.wssMessage.bind(this, reject));
    }

    wssMessage(reject: (error?: any) => void, msgString: any): void {
        try {
            let message: any = JSON.parse(msgString);
            if (message && message.eventType) {
                switch(message.eventType) {
                    case "unload":
                        reject("User closed browser.");
                        break;
                    case "load":
                        this.msg.debug(`WebSocket established.`);
                        break;
                    default:
                        this.msg.warn(`Didn't understand wss event type: ${message.eventType}.`);
                }
            } else {
                throw new Error("Didn't understand wss message format.");
            }
        } catch (err) {
            this.msg.warn(err);
        }
    }
}
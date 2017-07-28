import { injectable, inject } from 'inversify';
import * as express from 'express';
import * as http from 'http';
import * as WebSocket from 'ws';
import * as bodyParser from 'body-parser';
import * as launch from 'launchpad';

import { BaseInputManager } from './base-input-manager';
import { curry } from '../util/curry';
import TYPES from '../di/types';
import * as i from '../i';
import * as it from '../i/template';

@injectable()
export class BrowserInputManager extends BaseInputManager {
    browserInstance: launch.Instance;
    serverInstance: http.Server;
    express: typeof express = express;
    webSocket: typeof WebSocket = WebSocket;
    launch: typeof launch = launch;
    bodyParser: typeof bodyParser = bodyParser;

    constructor(
        @inject(TYPES.UserMessager) protected msg: i.IUserMessager,
        @inject(TYPES.Path) private path: i.IPath,
    ) {
        super();
    }

    ask(config: it.IInputConfig): Promise<{ [key: string]: any }> {
        let answers = {};
        let promise = null;
        this.msg.write("Launching browser... please answer template questions and close.");
        return new Promise(curry.oneOf3(this.launchBrowserAndServer, this, config));
    }

    protected launchBrowserAndServer(
        config: it.IInputConfig,
        resolve: (value?: {} | PromiseLike<{}>) => void,
        reject: (reason?: any) => void): void
    {
        let httpServer: http.Server;
        let wss: WebSocket.Server;

        var app = this.express(); 
        app.use(this.bodyParser.json());
        app.use('/', this.express.static(this.path.join(__dirname, '..', 'browser-prompt')));
        app.get('/questions', (req, res) => res.json(config));
        app.post('/', curry.twoOf4(this.handleUserInput, this, resolve, reject));
        this.serverInstance = app.listen(3638, curry.oneOf3(this.launchBrowser, this, reject));
        wss = new this.webSocket.Server({ server: this.serverInstance });
        wss.on('connection', curry.twoOf4(this.wssConnection, this, resolve, reject));
    }

    protected handleUserInput(
        resolve: (value?: {} | PromiseLike<{}>) => void,
        reject: (reason?: any) => void,
        req: express.Request,
        res: express.Response): void
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
        this.launch.local(function(error, launcher) {
            if (error) {
                reject(error);
            } else {
                launcher("http://localhost:3638",
                    <launch.LaunchOptions>{ browser: "chrome", args: "--new-window" },
                    function(error, inst) {
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
        ws.on('message', curry.oneOf3(this.wssMessage, this, reject));
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
                this.msg.warn("Didn't understand wss message format: " + msgString);
            }
        } catch (err) {
            this.msg.warn(err);
        }
    }
}
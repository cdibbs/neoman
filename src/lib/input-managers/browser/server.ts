import * as http from 'http';
import { IUserMessager } from "../../i";
import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as WebSocket from 'ws';
import { IInputConfig } from "../../i/template";
import { Client } from "./client";
import { curry } from '../../util/curry';

export class Server {
    serverInstance: http.Server;
    express: typeof express = express;
    bodyParser: typeof bodyParser = bodyParser;
    webSocket: typeof WebSocket = WebSocket;

    constructor(
        protected msg: IUserMessager,
        protected resolve: (value?: {} | PromiseLike<{}>) => void,
        protected reject: (reason?: any) => void
    ) {

    }

    launch(
        staticContentPath: string,
        inputConfig: IInputConfig,
        client: Client
    ) {
        var app = this.express(); 
        app.use(this.bodyParser.json());
        app.use('/', this.express.static(staticContentPath));
        app.get('/questions', (req, res) => res.json(inputConfig));
        app.post('/', curry.bindOnly(this.handleUserInput, this));
        this.serverInstance = app.listen(3638, curry.bindOnly(client.launch, client));
        const wss = new this.webSocket.Server({ server: this.serverInstance });
        wss.on('connection', curry.bindOnly(this.wssConnection, this));
    }

    stop(): void {
        if (this.serverInstance) {
            this.serverInstance.close();
        }
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
                        this.msg.i18n().debug(`WebSocket established.`);
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

    protected handleUserInput(
        req: express.Request,
        res: express.Response
    ): void {
        try {
            this.resolve(req.body);
        } catch(err) {
            this.reject(err);
        }
    }
}
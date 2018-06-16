import { Test, Setup } from "alsatian";
import { Express, Handler } from "express";
import { json, OptionsJson } from "body-parser";
import { Server } from "./server";
import { IWebSocketFactory } from "./i-websocket-factory";
import { IMock, Mock, It, Times } from "typemoq";
import { IUserMessager } from "../../i";
import { NextHandleFunction } from "connect";
import { mockMessagerFactory } from "../../../spec-lib/typemoq-messager";
import { Assert } from "alsatian-fluent-assertions";
import { IClient } from "./i-client";
import _ = require("underscore");

export class ServerTest {
    wsFactoryMock: IMock<IWebSocketFactory>;
    msgr: IUserMessager;
    protected resolveMock: IMock<(v?: {} | PromiseLike<{}>) => void>;
    protected rejectMock: IMock<(r?: any) => void>;
    protected expressFactoryMock: IMock<() => Express>;
    protected appMock: IMock<Express>;
    protected staticFactoryMock: IMock<(path: string, opts: any) => Handler>;
    protected bodyParserMock: IMock<{ json: (opts?: OptionsJson) => any }>;
    protected clientMock: IMock<IClient>;
    server: Server;

    @Setup
    public beforeEach() {
        this.wsFactoryMock = Mock.ofType<IWebSocketFactory>();
        this.msgr = mockMessagerFactory();
        this.resolveMock = Mock.ofInstance(() => {});
        this.rejectMock = Mock.ofInstance(() => {});
        this.appMock = Mock.ofType<Express>();
        this.expressFactoryMock = Mock.ofType<() => Express>();
        this.expressFactoryMock
            .setup(x => x())
            .returns(() => this.appMock.object);
        this.clientMock = Mock.ofType<IClient>();
        this.staticFactoryMock = Mock.ofType<(path: string, opts: any) => Handler>();
        this.bodyParserMock = Mock.ofType<{ json: (opts?: OptionsJson) => any }>();
        this.server = new Server(this.wsFactoryMock.object, this.msgr,
            this.resolveMock.object, this.rejectMock.object);
        this.server["express"] = this.expressFactoryMock.object;
        this.server["static"] = <any>this.staticFactoryMock.object;
        this.server["bodyParser"] = <any>this.bodyParserMock.object;
    }

    @Test()
    public launch_registersJSONBodyParser() {
        const jsonMock = Mock.ofType<NextHandleFunction>();
        this.bodyParserMock
            .setup(x => x.json())
            .returns(() => jsonMock.object);
        this.server.launch("/tmp/a/path", { }, this.clientMock.object);

        this.appMock.verify(x => x.use(jsonMock.object), Times.once());
    }

    @Test()
    public launch_setsUpStaticEndpoint() {
        const staticContentPath = "/tmp";
        const staticHandler = Mock.ofType<Handler>();
        const staticFnMock = Mock.ofInstance((p: string) => {});
        staticFnMock
            .setup(x => x(It.isAnyString()))
            .returns(() => staticHandler.object);
        this.server.static = <any>staticFnMock.object;
        

        this.server.launch(staticContentPath, {}, this.clientMock.object);

        this.appMock.verify(x => x.use('/', staticHandler.object), Times.once());        
        staticFnMock.verify(x => x(staticContentPath), Times.once());

    }

    @Test()
    public launch_setsUpQuestionsEndpoint() {
        const inputConfig = { "test": "config653" };
        let questionsCallback: (a: any, b: { json: Function }) => any;
        let r: any;
        const res = { json: (input: any) => { return r = input; } };

        this.server.launch("/some/path", <any>inputConfig, this.clientMock.object);

        this.appMock
            .verify(x => x.get('/questions', It.is(x => { questionsCallback = <any>x; return x instanceof Function; })), Times.once());
        const json = questionsCallback({}, res);
        Assert(r).deeplyEquals(inputConfig);
        Assert(json).deeplyEquals(inputConfig);
    }

    @Test()
    public launch_setsUpAnswersDictionaryPostEndpoint() {
        const handleUserInputMock = Mock.ofInstance(() => {});
        let actualPostCallback: Function;
        this.server["handleUserInput"] = handleUserInputMock.object;
        this.appMock
            .setup(x => x.post('/', It.is(x => { actualPostCallback = x; return x instanceof Function; })))

        this.server.launch("/some/path", {}, this.clientMock.object);

        actualPostCallback();
        handleUserInputMock
            .verify(x => x(), Times.once());
    }

    @Test()
    public launch_listensOn3638() {

    }

    @Test()
    public launch_callsBrowserClientAfterServerLaunched() {

    }

    @Test()
    public launch_bindsWebSocket() {

    }

    @Test()
    public stop_stopsServerIffExists() {

    }

    @Test()
    public handleUserInput_attemptsResolutionWithReqBodyOtherwiseRejects() {
        
    }
}
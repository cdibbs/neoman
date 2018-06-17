import { Test, Setup } from "alsatian";
import { Server as WebSocketServer, ServerOptions } from "ws";
import { Server as HttpServer, IncomingMessage } from "http";
import { WebSocket as NeomanWebSocket } from "./websocket";
import { IUserMessager } from "../../i";
import { mockMessagerFactory } from "../../../spec-lib/typemoq-messager";
import { IMock, Mock, Times, It } from "typemoq";
import { Assert } from "alsatian-fluent-assertions";

export class WsMock {
    public onMock: IMock<(t: string, f: Function) => void>;
    constructor(public opts: ServerOptions) {
        this.onMock = Mock.ofType<(t: string, f: Function) => void>();
        this.on = <any>this.onMock.object;
    }

    on(ev: string, f: (socket: any, req: IncomingMessage) => void): this {
        throw new Error("Should be overridden in constructor.");
    };
}

export class WebSocketTest {
    protected webSocket: NeomanWebSocket;
    protected msgr: IUserMessager;
    protected resolveMock: IMock<(v?: {} | PromiseLike<{}>) => void>;
    protected rejectMock: IMock<(r?: any) => void>;
    protected consoleMock: IMock<Console>;

    @Setup
    public beforeEach() {
        let obj: { echo: false, out: { mockConsole: IMock<Console> } } = { echo: false, out: { mockConsole: null } };
        this.msgr = mockMessagerFactory(obj);
        this.consoleMock = obj.out["mockConsole"];
        this.resolveMock = Mock.ofInstance(() => {});
        this.rejectMock = Mock.ofInstance(() => {});
        this.webSocket = new NeomanWebSocket(this.msgr, this.resolveMock.object, this.rejectMock.object);
    }

    @Test()
    public initialize_usesWS() {
        Assert(this.webSocket["ws"]).equals(WebSocketServer);
    }

    @Test()
    public initialize_createsServerAgainstProvidedHttpAndBindsConnection() {
        this.webSocket["ws"] = <any>WsMock;
        const serverMock = Mock.ofType<HttpServer>();
        this.webSocket.initialize(serverMock.object);
        this.webSocket["wss"]["onMock"]
            .verify((x: Function) => x('connection', It.is(x => x instanceof Function)), Times.once());
    }

    @Test()
    public wssConnection_bindsMessagesChannel() {
        let actualCallback: Function;
        const wsMock = Mock.ofInstance({ on: (a: string, b: Function) => {} });
        const wsMessageMock = Mock.ofInstance(() => {});
        this.webSocket["wssMessage"] = wsMessageMock.object;
        this.webSocket["wssConnection"](wsMock.object, {});

        wsMock.verify(x => x.on('message', It.is(f => { actualCallback = f; return f instanceof Function; })), Times.once());
        actualCallback();
        wsMessageMock.verify(x => x(), Times.once());
    }

    @Test()
    public wssMessage_handlesUnloadWithRejection() {
        const messageString = JSON.stringify({ eventType: "unload" });
        this.webSocket["wssMessage"](messageString);
        this.rejectMock.verify(x => x("User closed browser."), Times.once());
    }

    @Test()
    public wssMessage_handlesLoadOnlyWithStatusMessage() {
        const messageString = JSON.stringify({ eventType: "load" });
        this.webSocket["wssMessage"](messageString);
        this.consoleMock.verify(x => x.log("WebSocket established."), Times.once());
    }

    // This channel is mainly a nicety, for now, so we're more interested
    // in warnings than errors.
    @Test()
    public wssMessage_warnsWhenMessageNotUnderstood() {
        const messageString = JSON.stringify({ eventType: "bogus" });
        this.webSocket["wssMessage"](messageString);
        this.consoleMock.verify(x => x.warn(It.isAnyString()), Times.once());
    }

    @Test()
    public wssMessage_warnsWhenBadMessageFormat() {
        const messageString = JSON.stringify({});
        this.webSocket["wssMessage"](messageString);
        this.consoleMock.verify(x => x.warn(It.isAnyString()), Times.once());
    }

    @Test()
    public wssMessage_warnsWhenUnknownError() {
        const messageString = "}|0134\]gobbly gook";
        this.webSocket["wssMessage"](messageString);
        this.consoleMock.verify(x => x.warn(It.isAny()), Times.once());
    }
}

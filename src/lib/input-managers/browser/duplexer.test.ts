import { Duplexer } from "./duplexer";
import { Setup, TestCase, AsyncTest } from "alsatian";
import { IUserMessager, IPath } from "../../i";
import { mockMessagerFactory } from "../../../spec-lib";
import { Mock, IMock, Times, It } from "typemoq";
import { IServerFactory } from "./i-server-factory";
import { IClientFactory } from "./i-client-factory";
import { IServer } from "./i-server";
import { IClient } from "./i-client";
import { Assert } from "alsatian-fluent-assertions";
import { IInputConfig } from "../../i/template";

export class DuplexerTest {
    msgr: IUserMessager;
    pathMock: IMock<IPath>;
    serverFactoryMock: IMock<IServerFactory>;
    clientFactoryMock: IMock<IClientFactory>;
    duplexer: Duplexer;

    @Setup
    setup() {
        this.msgr = mockMessagerFactory();
        this.pathMock = Mock.ofType<IPath>();
        this.serverFactoryMock = Mock.ofType<IServerFactory>();
        this.clientFactoryMock = Mock.ofType<IClientFactory>();
        this.duplexer = new Duplexer(this.msgr, this.pathMock.object,
            this.serverFactoryMock.object, this.clientFactoryMock.object);
    }

    @AsyncTest()
    async getAnswers_launchesServerWithPathConfigClient() {
        const config: IInputConfig = <any>{ something: "anything" };
        const path = "whoa";
        const values = { test: "values" };
        const serverMock = Mock.ofType<IServer>();
        const clientMock = Mock.ofType<IClient>();
        this.serverFactoryMock
            .setup(m => m.build(It.isAny(), It.isAny()))
            .returns(() => serverMock.object)
        this.clientFactoryMock
            .setup(m => m.build(It.isAny(), It.isAny()))
            .returns((res, rej) => {
                res(values);
                return clientMock.object;
            });
        this.pathMock
            .setup(m => m.join(It.isAny(), "..", "..", "browser-prompt"))
            .returns(() => path);

        const results = await this.duplexer.getAnswers(config);

        serverMock.verify(m => m.launch(path, config, clientMock.object), Times.once());
        Assert(results).equals(values);
    }

    @TestCase(false, false)
    @TestCase(false, true)
    @TestCase(true, false)
    @TestCase(true, true)
    stop_stopsServerClientWhenExist(hasServer: boolean, hasClient: boolean) {
        const clientMock = Mock.ofType<IClient>();
        const serverMock = Mock.ofType<IServer>();
        this.duplexer.client = hasClient ? clientMock.object : null;
        this.duplexer.server = hasServer ? serverMock.object : null;

        Assert(() => this.duplexer.stop()).not.throws();

        clientMock.verify(m => m.stop(), Times.exactly(hasClient ? 1 : 0));
        serverMock.verify(m => m.stop(), Times.exactly(hasServer ? 1 : 0));
    }
}
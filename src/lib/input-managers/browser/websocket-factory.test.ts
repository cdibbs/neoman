import { Setup, Test } from "alsatian";
import { Assert } from "alsatian-fluent-assertions";
import { Server as HttpServer } from "http";
import { Mock } from "typemoq";
import { WebSocketFactory } from ".";
import { mockMessagerFactory } from "../../../spec-lib";
import { IUserMessager } from "../../i";

export class WebSocketFactoryTest {
    wsFactory: WebSocketFactory;
    msg: IUserMessager;

    @Setup
    public beforeEach() 
    {
        this.msg = mockMessagerFactory();
        this.wsFactory = new WebSocketFactory(this.msg);
    }

    @Test()
    public build_buildsValidWebSocketWrapper() {
        const mockServer = Mock.ofType<HttpServer>();
        const mockResolve = Mock.ofInstance(() => {});
        const mockReject = Mock.ofInstance(() => {});
        const result = this.wsFactory.build(mockServer.object, mockResolve.object, mockReject.object);
        Assert()
            .not.isNull();
        Assert(this.wsFactory["msg"])
            .not.isNull()
            .equals(this.msg);
    }
}
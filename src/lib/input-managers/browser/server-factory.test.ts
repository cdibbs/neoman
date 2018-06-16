import { IUserMessager } from "../../i";
import { Test } from "alsatian";
import { Mock } from "typemoq";
import { Assert } from "alsatian-fluent-assertions";
import { Server } from "./server";
import { ServerFactory } from "./server-factory";
import { IWebSocketFactory } from "./i-websocket-factory";


export class ServerFactoryTest {
    @Test()
    build_buildsValidServer() {
        const msgMock = Mock.ofType<IUserMessager>();
        const wsFactory = Mock.ofType<IWebSocketFactory>();
        const f = new ServerFactory(msgMock.object, wsFactory.object);
        const resolveMock = Mock.ofInstance(() => {});
        const rejectMock = Mock.ofInstance(() =>{});

        const result = f.build(resolveMock.object, rejectMock.object);

        //const a = Assert(result).is(Server);
        Assert(result)
            .is(Server)
            .has(<any>"wsFactory")
                .that.equals(wsFactory.object).kThx
            .has(<any>"resolve")
                .that.equals(resolveMock.object).kThx
            .has(<any>"reject")
                .that.equals(rejectMock.object);
    }
}
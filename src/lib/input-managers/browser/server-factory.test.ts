import { IUserMessager } from "../../i";
import { Test } from "alsatian";
import { Mock } from "typemoq";
import { Assert } from "alsatian-fluent-assertions";
import { Server } from "./server";
import { ServerFactory } from "./server-factory";


export class ServerFactoryTest {
    @Test()
    build_buildsValidServer() {
        const msgMock = Mock.ofType<IUserMessager>();
        const f = new ServerFactory(msgMock.object);
        const resolveMock = Mock.ofInstance(() => {});
        const rejectMock = Mock.ofInstance(() =>{});

        const result = f.build(resolveMock.object, rejectMock.object);

        const a = Assert(result).is(Server);
        a.has(<any>"resolve").that.equals(resolveMock.object);
        a.has(<any>"reject").that.equals(rejectMock.object);
    }
}
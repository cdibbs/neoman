import { ClientFactory } from "./client-factory";
import { IUserMessager } from "../../i";
import { Test } from "alsatian";
import { Mock } from "typemoq";
import { Assert } from "alsatian-fluent-assertions";
import { Client } from "./client";


export class ClientFactoryTest {
    @Test()
    build_buildsValidClient() {
        const msgMock = Mock.ofType<IUserMessager>();
        const f = new ClientFactory(msgMock.object);
        const resolveMock = Mock.ofInstance(() => {});
        const rejectMock = Mock.ofInstance(() =>{});

        const result = f.build(resolveMock.object, rejectMock.object);

        const a = Assert(result).is(Client);
        a.has(<any>"resolve").that.equals(resolveMock.object);
        a.has(<any>"reject").that.equals(rejectMock.object);
    }
}
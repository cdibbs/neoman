import { FocusTests, Setup, Teardown, Test, TestFixture } from 'alsatian';
import { Assert } from 'alsatian-fluent-assertions';
import { Command } from "commandpost";
import { IMock, It, Mock, Times } from 'typemoq';
import { mockMessagerFactory } from '../../spec-lib';
import { CommandFactory } from './command-factory';

@TestFixture("Base command validator tests")
export class CommandFactoryTests {
    c: CommandFactory;
    cmdMock: IMock<Command<any, any>>;
    cOneRunMock: IMock<(a: Command<any, any>, b: any, c: any) => void>;

    @Setup
    public beforeEach() {
        let out = <any>{ mockConsole: null };
        let msg = mockMessagerFactory({ out: out });
        this.cmdMock = Mock.ofType<Command<any, any>>();
        this.cOneRunMock = Mock.ofInstance((a: Command<any, any>, b: any, c: any) => {});
        const cTwoRunMock = Mock.ofInstance(() => {});
        this.c = new CommandFactory(msg, [<any>{ type: "one", run: this.cOneRunMock.object }, <any>{ type: "two", run: cTwoRunMock.object }]);
    }

    @Teardown
    public afterEach() {

    }

    @Test()
    public buildsDict() {
        Assert(this.c["cmdDict"])
            .isDefined()
            .hasKeys(["one", "two"]);
    }

    @Test()
    public shouldSetTempDir() {
        const result = this.c.build(<any>'one', '/my/dir', this.cmdMock.object);
        Assert(result).has({"tempDir": "/my/dir"});
    }

    @Test()
    public shouldErrorIfCommandDNE() {
        Assert(() => this.c.build(<any>"third", "", this.cmdMock.object))
            .throws().that.has({message: /Command not implemented: third./});
    }

    @Test()
    public build_shouldBindAction() {
        let func: (b: any, c: any) => {} = null;
        this.cmdMock
            .setup(m => m.action(It.isAny()))
            .callback(f => func = f);
        const result = this.c.build(<any>'one', '/my/dir', this.cmdMock.object);
        this.cmdMock
            .verify(m => m.action(It.is(f => typeof f === "function")), Times.once());
        func(<any>2,3);
        this.cOneRunMock.verify(c => c(<any>this.cmdMock.object,2,3), Times.once());
    }
}
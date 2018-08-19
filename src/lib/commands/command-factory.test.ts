// 3rd party imports installed via npm install
import { Setup, Teardown, Test, TestFixture } from 'alsatian';
import { Assert } from 'alsatian-fluent-assertions';
import { Command } from "commandpost";
import * as TypeMoq from "typemoq";
import { IMock } from 'typemoq';
// internal imports (always a relative path beginning with a ./ or ../)
import { mockMessagerFactory } from '../../spec-lib';
import { CommandFactory } from './command-factory';



@TestFixture("Base command validator tests")
export class CommandFactoryTests {
    c: CommandFactory;
    cmdMock: IMock<Command<any, any>>;

    @Setup
    public beforeEach() {
        let out = <any>{ mockConsole: null };
        let msg = mockMessagerFactory({ out: out });
        this.cmdMock = TypeMoq.Mock.ofType<Command<any, any>>();
        this.c = new CommandFactory(msg, [<any>{type: "one"}, <any>{type: "two"}]);
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
        let result = this.c.build(<any>'one', '/my/dir', this.cmdMock.object);
        Assert(result).has({"tempDir": "/my/dir"});
    }

    @Test()
    public shouldErrorIfCommandDNE() {
        Assert(() => this.c.build(<any>"third", "", this.cmdMock.object))
            .throws().that.has({message: /Command not implemented: third./});
    }

    @Test()
    public build_shouldBindAction() {
        Assert.fail("Not implemented.");
    }
}
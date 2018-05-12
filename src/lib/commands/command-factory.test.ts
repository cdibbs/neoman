// 3rd party imports installed via npm install
import { Test, TestFixture, AsyncTest, TestCase, AsyncSetup, AsyncTeardown, Teardown, Setup } from 'alsatian';
import { Command } from "commandpost";
import * as TypeMoq from "typemoq";
import { It, Times } from 'typemoq';
import { Assert } from 'alsatian-fluent-assertions';

// internal imports (always a relative path beginning with a ./ or ../)
import { CommandFactory } from './command-factory';
import { IUserMessager } from '../i';
import { mockMessagerFactory } from '../../spec-lib';


@TestFixture("Base command validator tests")
export class CommandFactoryTests {
    c: CommandFactory;

    @Setup
    public beforeEach() {
        let out = <any>{ mockConsole: null };
        let msg = mockMessagerFactory({ out: out });
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
        let result = this.c.build(<any>'one', '/my/dir');
        Assert(result).has({"tempDir": "/my/dir"});
    }

    @Test()
    public shouldErrorIfCommandDNE() {
        Assert(() => this.c.build(<any>"third", ""))
            .throws().that.has({message: /Command not implemented: third./});
    }
}
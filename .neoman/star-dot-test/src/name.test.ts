
import { FocusTests, Setup, Test, TestFixture } from 'alsatian';
import { Assert } from 'alsatian-fluent-assertions';
import { IFileSystem, IPath, IUserMessager } from "../../../src/lib/i";
import { mockMessagerFactory } from '../../../src/spec-lib';

@TestFixture("Test Fixture Name")
export class ClassNameTests {
    msgr: IUserMessager;
    inst: ClassName;

    @Setup
    public beforeEach() {
        const out = { mockConsole: <any>null };
        this.msgr = mockMessagerFactory({out: out});
        this.inst = new ClassName(this.msgr);
    }

    @Test()
    atest() {
        throw new Error("Unimplemented test.");
    }
}
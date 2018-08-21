// 3rd party imports installed via npm install
import { AsyncSetup, AsyncTest, Teardown, TestCase, TestFixture } from 'alsatian';
import { Assert } from 'alsatian-fluent-assertions';
import { Command } from "commandpost";
import * as TypeMoq from "typemoq";
import { It, Times } from 'typemoq';
// internal imports (always a relative path beginning with a ./ or ../)
import { IFileSystem, IPath, ISettingsProvider, IUserMessager } from '../../i';
import KEYS from '../../settings-keys';
import { SetDirCommand } from './set-dir-command';
let NestedError = require('nested-error-stacks');

@TestFixture("Setdir command tests")
export class SetdirCommandTests {
    cmdDef: Command<any, any>;
    msgrMock: TypeMoq.IMock<IUserMessager>;
    procMock: TypeMoq.IMock<NodeJS.Process>;
    setProvMock: TypeMoq.IMock<ISettingsProvider>;
    fsMock: TypeMoq.IMock<IFileSystem>;
    pathMock: TypeMoq.IMock<IPath>;
    c: SetDirCommand;

    @AsyncSetup
    public async beforeEach() {
        this.cmdDef = <any>{ help: () => "" };
        this.msgrMock = TypeMoq.Mock.ofType<IUserMessager>();
        this.procMock = TypeMoq.Mock.ofType<NodeJS.Process>();
        this.setProvMock = TypeMoq.Mock.ofType<ISettingsProvider>();
        this.fsMock = TypeMoq.Mock.ofType<IFileSystem>();
        this.pathMock = TypeMoq.Mock.ofType<IPath>();
        this.c = new SetDirCommand(this.msgrMock.object, this.procMock.object, this.setProvMock.object,
            this.fsMock.object,
            this.pathMock.object);
        this.c.tempDir = "/tmp/mytemplates";
    }

    @Teardown
    public async afterEach() {

    }

    @TestCase(false, false, /Warning:.*is not a directory/, 1, 1)
    @TestCase(true, false, /not called/, 1, 0)
    @TestCase(true, true, /.*/, 0, 1)
    @AsyncTest('run - should warn when not a directory.')
    public async run_ShouldWarnWhenNotDir(
        isDir: boolean,
        throws: boolean,
        warnPtrn: RegExp,
        setTimes: number,
        warnTimes: number
    ): Promise<void> {
        const opts = {}, args = { directory: "test" };
        const resolvedDir = "./resolved/dir";
        let stats = { isDirectory: (): boolean => isDir };
        let statsSetup = this.fsMock.setup(f => f.statSync(It.isAny()));
        statsSetup.returns(() => <any>stats);
        if (throws) statsSetup.throws(new Error("reallly bad"));

        this.pathMock.setup(p => p.resolve(It.is(p => p === args.directory))).returns(() => resolvedDir);
        this.setProvMock.setup(s => s.set(It.isAnyString(), It.isAny()));
        this.msgrMock.setup(m => m.i18n(It.isAny())).returns(() => this.msgrMock.object);
        this.msgrMock.setup(m => m.warn(It.isAnyString()));
        
        const testFn = async () => this.c.run(this.cmdDef, opts, args);
        (await Assert(testFn)
            .maybe(throws).throwsAsync())
                .that.maybe(throws).has({ stack: /reallly bad/ });

        this.msgrMock.verify(m => m.warn(It.is(p => warnPtrn.test(p))), Times.exactly(warnTimes));
        this.setProvMock.verify(s => s.set(It.is(k => k === KEYS.tempDirKey), It.is(v => v === resolvedDir)), Times.exactly(setTimes))
    }
}
import { Setup, Test, TestFixture, AsyncTest, FocusTest, FocusTests } from 'alsatian';
import { IMock, Mock, Times, It } from 'typemoq';
import { mockMessagerFactory } from '../spec-lib/typemoq-messager';
import { ICommandFactory, ICommand } from './commands';
import { IPackage, IPath, ISettingsProvider, Ii18nFunction } from './i';
import { UserMessager } from './integrations';
import { Kernel } from './kernel';
import { Command } from 'commandpost';


@TestFixture("Kernel tests")
export class KernelTests {
    procMock: IMock<NodeJS.Process>;
    spMock: IMock<ISettingsProvider>;
    pkgMock: IMock<IPackage>;
    cfMock: IMock<ICommandFactory>;
    i18nMock: IMock<Ii18nFunction>;
    k: Kernel;
    pathMock: IMock<IPath>;
    msgr: UserMessager;
    cpCreateMock: IMock<(n: string) => Command<any, any>>;
    rootCmdMock: IMock<Command<any, any>>;
    cmds: IMock<ICommand<any, any>>[];
    
    @Setup
    public beforeEach() {
        this.pathMock = Mock.ofType<IPath>();
        this.msgr = mockMessagerFactory();
        this.procMock = Mock.ofType<NodeJS.Process>();
        this.pkgMock = Mock.ofType<IPackage>();
        this.spMock = Mock.ofType<ISettingsProvider>();
        this.cfMock = Mock.ofType<ICommandFactory>();
        this.i18nMock = Mock.ofType<Ii18nFunction>();
        this.cpCreateMock = Mock.ofType<(n: string) => Command<any, any>>();
        this.rootCmdMock = Mock.ofType<Command<any, any>>();
        this.k = new Kernel(this.msgr, this.procMock.object, this.spMock.object, this.pkgMock.object, this.cfMock.object, this.i18nMock.object);
        this.k["cpCreate"] = this.cpCreateMock.object;

        this.procMock
            .setup(m => m.argv)
            .returns(_ => []);
        this.pkgMock
            .setup(m => m.version)
            .returns(_ => "1.0.0");
        this.cpCreateMock
            .setup(m => m(It.isAnyString()))
            .returns(_ => this.rootCmdMock.object);
        this.rootCmdMock
            .setup(m => m.version(It.isAny(), It.isAny()))
            .returns(_ => this.rootCmdMock.object);
        this.rootCmdMock
            .setup(m => m.description(It.isAnyString()))
            .returns(_ => this.rootCmdMock.object);
        this.rootCmdMock
            .setup(m => m.option(It.isAnyString(), It.isAnyString(), It.isAny()))
            .returns(_ => this.rootCmdMock.object);
        this.rootCmdMock
            .setup(m => m.subCommand(It.isAnyString()))
            .returns(_ => this.rootCmdMock.object);
    }

    @AsyncTest("Go() - handles unexpected command errors.")
    async Go_handlesError() {
        /* const error = new Error();
        this.cpCreateMock
            .setup(m => m(It.isAnyString()))
            .throws(error);
        const herrMock = Mock.ofInstance((e: Error) => Promise.resolve({}));
        herrMock
            .setup(m => m(error))
            .returns(() => Promise.resolve({}));
        this.k["handleError"] = herrMock.object;

        const result = await this.k.Go();

        herrMock.verify(m => m(error), Times.once()); */
    }

    @AsyncTest("Go() - should setup commands and execute without error.")
    async Go_runsWithoutError() {
        await this.k.Go();
        this.procMock
            .verify(m => m.exit(It.is(n => n > 0)), Times.never());
    }

    @AsyncTest("handleError() - wraps unexpected errors to ensure intelligible indication of error.")
    async handleError_wrapsIntelligently() {

    }

    @AsyncTest("handleError() - should exit explicitly to handle crashed async weirdness.")
    async handleError_shouldCallProcessExit() {

    }

    @AsyncTest("handleCommandResult() - displays validation errors and doesn't reject.")
    async handleCommandResult_displaysValidationErrorsButDoesntReject() {

    }

    @AsyncTest("handleCommandResult() - wraps unexpected errors to ensure intelligible indication of error.")
    async handleCommandResult_wrapsUnexpected() {

    }
}
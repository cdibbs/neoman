// 3rd party imports installed via npm install
import { Test, TestFixture, AsyncTest, TestCase, AsyncSetup, AsyncTeardown, Teardown, Setup } from 'alsatian';
import { Command } from "commandpost";
import * as TypeMoq from "typemoq";
import { It, Times } from 'typemoq';

// internal imports (always a relative path beginning with a ./ or ../)
import { IUserMessager, IErrorReporter, ITemplateManager, IPath, ITemplateRunner } from '../../i';
import { INewCmdOpts, INewCmdArgs, ICommandValidator } from '../i';
import { ITemplate } from '../../i/template';
import { mockMessagerFactory } from '../../../spec-lib'
import { NewCommand } from './new-command';
import { CommandResult, CommandValidationResult, RunnerResult, CommandErrorType } from '../../models';
import { Assert } from 'alsatian-fluent-assertions';


@TestFixture("New command tests")
export class NewCommandTests {
    cmdDef: Command<any, any>;
    msgrMock: TypeMoq.IMock<IUserMessager>;
    tmplRunnerMock: TypeMoq.IMock<ITemplateRunner>;
    errRepMock: TypeMoq.IMock<IErrorReporter>;
    cmdValidatorMock: TypeMoq.IMock<ICommandValidator<INewCmdOpts, INewCmdArgs>>;
    tmplMgrMock: TypeMoq.IMock<ITemplateManager>;
    c: NewCommand;

    @AsyncSetup
    public async beforeEach() {
        this.cmdDef = <any>{ help: () => "" };
        this.msgrMock = TypeMoq.Mock.ofType<IUserMessager>();
        this.tmplMgrMock = TypeMoq.Mock.ofType<ITemplateManager>();
        this.errRepMock = TypeMoq.Mock.ofType<IErrorReporter>();
        this.tmplRunnerMock = TypeMoq.Mock.ofType<ITemplateRunner>();
        this.cmdValidatorMock = TypeMoq.Mock.ofType<ICommandValidator<INewCmdOpts, INewCmdArgs>>();
        this.c = new NewCommand(mockMessagerFactory(), this.tmplMgrMock.object, <IPath>{ sep: "/" },
            this.tmplRunnerMock.object, this.errRepMock.object, this.cmdValidatorMock.object);
        this.c.tempDir = "/tmp/mytemplates";
    }

    @Teardown
    public async afterEach() {

    }

    @TestCase(CommandErrorType.UserError, CommandValidationResult, 0)
    @TestCase(CommandErrorType.None, RunnerResult, 1)
    @AsyncTest('run - only runs when no validation error.')
    public async runValidated_globShouldUseTempDir(errorType: CommandErrorType, expectedResult: { new(): CommandResult }, timesRun: number) {
        let validationResult = new CommandValidationResult();
        validationResult.ErrorType = errorType;
        this.cmdValidatorMock
            .setup(c => c.validate(It.isAny(), It.isAny(), It.isAny()))
            .returns(() => Promise.resolve(validationResult));
        this.tmplRunnerMock
            .setup(m => m.run(It.isAnyString(), It.isAny(), It.isAny()))
            .returns(() => Promise.resolve(new RunnerResult()));

        let actualCmdResult = await this.c.run(<any>{}, <any>{}, <any>{});

        this.errRepMock.verify<void>(m => m.reportError(It.isAny()), Times.never());
        this.tmplRunnerMock.verify(m => m.run(It.isAnyString(), It.isAny(), It.isAny()), Times.exactly(timesRun));
        Assert(actualCmdResult).is(expectedResult);
    }

    @Test('buildOptions - survives an empty object.')
    public buildOptions_survivesEmpty() {
        this.c["buildOptions"](<any>{});
    }
}
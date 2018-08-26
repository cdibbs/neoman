// 3rd party imports installed via npm install
import { AsyncSetup, AsyncTest, Teardown, Test, TestCase, TestFixture } from 'alsatian';
import { Assert } from 'alsatian-fluent-assertions';
import { Command } from "commandpost";
import * as TypeMoq from "typemoq";
import { It, Times } from 'typemoq';
import { mockMessagerFactory } from '../../../spec-lib';
import { IErrorReporter, IPath, ITemplateRunner, IUserMessager } from '../../i';
import { CommandErrorType, CommandResult, CommandValidationResult, RunnerResult } from '../../models';
import { ITemplateManager } from '../../template-management';
import { ICommandValidator, INewCmdArgs, INewCmdOpts } from '../i';
import { NewCommand } from './new-command';

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
        this.cmdDef = <any>{ helpText: () => "" };
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
    public async run_onlyRunsWhenNoValidationError(errorType: CommandErrorType, expectedResult: { new(): CommandResult }, timesRun: number) {
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

    @Test()
    public async run_trapsReportsError(): Promise<void> {
        this.cmdValidatorMock
            .setup(c => c.validate(It.isAny(), It.isAny(), It.isAny()))
            .throws(new Error("of mine"));
        
        const result = await this.c.run(<any>{}, <any>{}, <any>{});

        this.errRepMock
            .verify(m => m.reportError(
                It.is(e => e instanceof Error && /of mine/.test(e.message))),
                Times.once());    
    }

    @TestCase({})
    @TestCase({showExcluded: false})
    @Test('buildOptions - survives different input objects.')
    public buildOptions_survivesEmpty(val: any) {
        const result = this.c["buildOptions"](val);
        Assert(result).hasAllAsserts({
            name: a => a.not.isEmpty(),
            path: a => a.not.isEmpty(),
            verbosity: /normal|verbose|debug/,
            showExcluded: a => a.satisfies(e => e === true || e === false),
            defaults: a => a.satisfies(e => e === true || e === false),
            force: a => a.satisfies(e => e === true || e === false),
            simulate: a => a.satisfies(e => e === true || e === false),
            rawArgs: undefined,
            extraArgs: undefined
        });
    }
}
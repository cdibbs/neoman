import { AsyncTest, Setup, Test, TestCase, TestFixture } from 'alsatian';
import { Assert } from 'alsatian-fluent-assertions';
import { IMock, It, Mock, Times } from 'typemoq';
import { mockMessagerFactory } from '../../spec-lib';
import { IFileSystem, Ii18nFunction, IInputManager, ITemplateValidator, IUserMessager, Levels } from '../i';
import { ITemplate } from '../i/template';
import { CommandErrorType, RunnerResult, RunOptions } from "../models";
import { IInputConfig } from '../user-extensibility';
import { IFSTreeProcessor } from './i';
import { TemplateRunner } from './template-runner';

@TestFixture("Template Runner Tests")
export class TemplateRunnerTests {
    i18nMock: IMock<Ii18nFunction>;
    writeMock: IMock<(s: string, n: number, l: Levels) => IUserMessager>;
    trunner: TemplateRunner;
    fsMock: IMock<IFileSystem>;
    fsTreeProcMock: IMock<IFSTreeProcessor>;
    imMock: IMock<IInputManager>;
    validatorMock: IMock<ITemplateValidator>;
    consoleMock: IMock<Console>;
    msgr: IUserMessager;

    @Setup
    public beforeEach() {
        const out = { mockConsole: <any>null };
        this.msgr = mockMessagerFactory({out: out});
        this.consoleMock = out.mockConsole;
        this.fsMock = Mock.ofType<IFileSystem>();
        this.fsTreeProcMock = Mock.ofType<IFSTreeProcessor>();
        this.imMock = Mock.ofType<IInputManager>();
        this.validatorMock = Mock.ofType<ITemplateValidator>();

        this.trunner = new TemplateRunner(this.msgr, this.fsMock.object,
            this.imMock.object, this.validatorMock.object, this.fsTreeProcMock.object);
    }

    @TestCase(false, CommandErrorType.SystemState)
    @TestCase(true, CommandErrorType.None)
    @AsyncTest("run - returns validation error when nothing installed.")
    public async run_returnsValidationError(hasDep: boolean, err: CommandErrorType) {
        this.fsMock.setup(m => m.readdirSync(It.isAnyString())).returns(() => []);
        this.validatorMock
            .setup(m => m.dependenciesInstalled(It.isAny()))
            .returns(() => { return { "somedep": hasDep }; })

        let result = await this.trunner.run("", <any>{}, <any>{});

        Assert(result)
            .maybe(!hasDep).has({
                ErrorType: err,
                Message: /configuration not valid/ });
    }

    @AsyncTest("run - returns validation error re: non-empty destination")
    public async run_returnsValidationErrorOnNonEmpty() {
        this.fsMock.setup(m => m.readdirSync(It.isAnyString())).returns(() => [ "not empty" ]);
        let result = await this.trunner.run("", <any>{}, <any>{});
        Assert(result).hasAsserts({
            ErrorType: CommandErrorType.SystemState,
            Message: a => a.isDefined()
        });
    }

    @AsyncTest()
    public async run_validConfig_getInputAndProcessesTheFileTree() {
        const answerDict = { answers: "yay" };
        const something: IInputConfig = <any>{ special: 123 };
        const opts = <RunOptions>{ };
        const destPath = "/tmp/somewhere-else";
        const tmpl: ITemplate = <any>{ input: something, __tmplPath: "/tmp/somewhere" };
        const runResult: RunnerResult = <any>{};
        this.fsMock
            .setup(m => m.readdirSync(It.isAnyString()))
            .returns(() => [ /* empty */ ]);
        this.imMock
            .setup(m => m.ask(It.isAny(), It.isAny()))
            .returns(() => Promise.resolve(answerDict));
        this.fsTreeProcMock
            .setup(m => m.process(It.isAny(), It.isAny(), It.isAny(), It.isAny(), It.isAny()))
            .returns(() => Promise.resolve(runResult));

        let result = await this.trunner.run(destPath, opts, tmpl);

        this.imMock.verify(m => m.ask(something, opts), Times.once());
        this.fsTreeProcMock.verify(m => m.process(tmpl.__tmplPath, destPath, opts, answerDict, tmpl), Times.once());
        Assert(result).strictlyEquals(runResult);
    }

    @TestCase([], true)
    @TestCase(["one"], false)
    @TestCase(["one", "two"], false)
    @Test("destinationEmpty - true when empty")
    public destinationEmpty_trueWhenEmpty(dirReturn: string[], isEmpty: boolean): void {
        this.fsMock.setup(m => m.readdirSync(It.isAnyString())).returns(s => dirReturn);
        const result = this.trunner["destinationEmpty"]("/tmp/some/path");
        Assert(result).equals(isEmpty);
    }

    @Test("finishRun - displays valid summary")
    public finishRun_displaysValidSummary(): void {
        this.trunner["finishRun"](<RunnerResult>{ processed: 314, excluded: 92, totalFiles: 653 });
        this.consoleMock.verify(m => m.log(It.is(s => /314 file\(s\) considered/.test(s))), Times.once());
        this.consoleMock.verify(m => m.log(It.is(s => /92 file\(s\) excluded/.test(s))), Times.once());
        this.consoleMock.verify(m => m.log(It.is(s => /653 file\(s\) copied/.test(s))), Times.once());
    }   
}
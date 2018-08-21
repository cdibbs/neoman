// 3rd party imports installed via npm install
import { AsyncSetup, AsyncTest, Teardown, Test, TestCase, TestFixture } from 'alsatian';
import { Assert } from 'alsatian-fluent-assertions';
import { Command } from "commandpost";
import * as TypeMoq from "typemoq";
import { It, Times } from 'typemoq';
import { mockMessagerFactory } from '../../../spec-lib';
import { ErrorReporter } from '../../error-reporter';
import { IErrorReporter, IFileSystem, IPath, IUserMessager, ITemplate } from '../../i';
import { CommandErrorType, CommandValidationResult } from "../../models";
import { ITemplateManager } from '../../template-management';
import { ICommandValidator } from '../i';
import { ListCommand } from './list-command';


@TestFixture("List command tests")
export class ListCommandTests {
    defaultValidationResponse: CommandValidationResult;
    cmdDef: Command<any, any>;
    c: ListCommand;
    errRepMock: TypeMoq.IMock<IErrorReporter>;
    cmdValidatorMock: TypeMoq.IMock<ICommandValidator<any, any>>;
    tmplManagerMock: TypeMoq.IMock<ITemplateManager>;
    messager: IUserMessager;
    consoleMock: TypeMoq.IMock<Console>;

    @AsyncSetup
    public async beforeEach() {
        this.cmdDef = <any>{ helpText: () => "" };
        this.cmdValidatorMock = TypeMoq.Mock.ofType<ICommandValidator<any, any>>();
        this.defaultValidationResponse = new CommandValidationResult();
        this.cmdValidatorMock.setup(m => m.validate(It.isAny(), It.isAny(), It.isAny())).returns(async () => this.defaultValidationResponse);
        this.tmplManagerMock = TypeMoq.Mock.ofType<ITemplateManager>();
        let out: any = {};
        this.messager = mockMessagerFactory({ out: out });
        this.consoleMock = out.mockConsole;
        
        
        this.c = new ListCommand(this.messager, <NodeJS.Process>{}, <IFileSystem>{ },
            <IPath>{}, this.cmdValidatorMock.object, this.tmplManagerMock.object);
        this.c.tempDir = "/tmp/mytemplates";

        this.errRepMock = TypeMoq.Mock.ofType<IErrorReporter>(ErrorReporter);
        this.cmdDef = <any>{ help: () => "" };
    }

    @Teardown
    public async afterEach() {

    }

    @TestCase(CommandErrorType.UserError, 0, true)
    @TestCase(CommandErrorType.None, 1, false)
    @AsyncTest("should return any validation error without running.")
    public async run_reportsAnyValidationError(err: CommandErrorType, n: number, isErr: boolean) {
        const r = new CommandValidationResult("bogus", err);
        this.cmdValidatorMock.reset();
        this.cmdValidatorMock
            .setup(m => m.validate(It.isAny(), It.isAny(), It.isAny()))
            .returns(() => Promise.resolve(r));
        this.tmplManagerMock
            .setup(m => m.list(It.isAny(), It.isAny(), It.isAny()))
            .callback((end, error, found) => end([]));

        let result = await this.c.run(this.cmdDef, <any>{}, <any>{ templateId: "none", template: "mytmp" });

        Assert(result).has(r => r.IsError).that.equals(isErr);
        this.tmplManagerMock.verify(m => m.list(It.isAny(), It.isAny(), It.isAny()), Times.exactly(n));
        this.errRepMock.verify<void>(x => x.reportError(TypeMoq.It.isAny()), TypeMoq.Times.never());        
    }

    @Test()
    public match_OutputsTemplateSummary(): void {
        this.c.match(<ITemplate><any>{ identity: "human", name: "Homo sapiens sapiens" });
        this.consoleMock.verify(
            x => x.log(It.is(s => /human - Homo sapiens sapiens/.test(s))),
            Times.once());
    }

    @Test()
    public error_OutputsAndRejects(): void {
        const rejectMock = TypeMoq.Mock.ofInstance((e: any) => {});
        const terr = { file: "something.json", error: new Error("hmm") };
        this.c.error(rejectMock.object, terr);
        this.consoleMock.verify(
            x => x.error(It.is(s => /Error reading template definition file: something\.json/.test(s))),
            Times.once());
        rejectMock.verify(m => m(terr), Times.once());
    }

    @TestCase(["some", "files"], 2)
    @TestCase(["some", "files", "for", "you"], 4)
    @TestCase([], 0)
    @TestCase(null, 0)
    @Test()
    public end_reportsSummaryResolvesSuccess(files: ITemplate[], n: number): void {
        const resolveMock = TypeMoq.Mock.ofInstance((e: any) => {});
        this.c.end(resolveMock.object, files);
        this.consoleMock.verify(
            x => x.log(It.is(s => new RegExp(`${n} template\(s\) found.`).compile().test(s))),
            Times.once());
        resolveMock.verify(m => m(It.is((v: CommandValidationResult) => v.ErrorType === CommandErrorType.None)), Times.once());
    }
}
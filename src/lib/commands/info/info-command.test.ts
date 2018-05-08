// 3rd party imports installed via npm install
import { Test, TestFixture, AsyncTest, TestCase, AsyncSetup, AsyncTeardown } from 'alsatian';
import { Assert, MatchMode } from 'alsatian-fluent-assertions';
import { Command } from "commandpost";
import * as TypeMoq from "typemoq";
import { It, Times } from 'typemoq';
import * as _ from "lodash";

import { ITemplateInfo } from './i/i-template-info';
import { TemplateInfo } from './template-info';
import { ITemplate } from '../../i/template';
import { mockMessagerFactory } from '../../../spec-lib'
import { InfoCommand } from './info-command';
import { ErrorReporter } from '../../error-reporter';
import { TemplateManager } from '../../template-management/template-manager'
import { CommandValidationResult, CommandErrorType } from "../../models";
import { IInfoCmdOpts, IInfoCmdArgs, ICommandValidator } from '../i';
import { IErrorReporter, IPath } from '../../i';
import { ITemplateManager } from '../../template-management';

@TestFixture("Info command tests")
export class InfoCommandTests {
    defaultValidationResponse: CommandValidationResult;
    ic: InfoCommand;
    cmdDef: Command<any, any>;
    errRepMock: TypeMoq.IMock<IErrorReporter>;
    tmplInfoMock: TypeMoq.IMock<ITemplateInfo>;
    tmplMgrMock: TypeMoq.IMock<ITemplateManager>;
    cmdValidatorMock: TypeMoq.IMock<ICommandValidator<IInfoCmdOpts, IInfoCmdArgs>>;

    @AsyncSetup
    public async beforeEach() {
        this.errRepMock = TypeMoq.Mock.ofType<IErrorReporter>(ErrorReporter);
        this.tmplInfoMock = TypeMoq.Mock.ofType<ITemplateInfo>(TemplateInfo);
        this.tmplMgrMock = TypeMoq.Mock.ofType<TemplateManager>();
        this.cmdValidatorMock = TypeMoq.Mock.ofType<ICommandValidator<IInfoCmdOpts, IInfoCmdArgs>>();
        this.defaultValidationResponse = new CommandValidationResult();
        this.cmdValidatorMock.setup(m => m.validate(It.isAny(), It.isAny(), It.isAny())).returns(async () => this.defaultValidationResponse);
        this.cmdDef = <any>{ help: () => "" };
        this.ic = new InfoCommand(this.tmplMgrMock.object, mockMessagerFactory(),
            <NodeJS.Process>{}, <IPath>{}, this.errRepMock.object, this.tmplInfoMock.object, this.cmdValidatorMock.object);
    
        this.ic["tempDir"] = "noop";
    }

    @AsyncTeardown
    public async afterEach() {

    }

    @AsyncTest("should get template info and report it to the user.")
    public async run_reportsTemplateInfoToUser() {
        let info = <ITemplate><any>{ interesting: false };
        this.tmplMgrMock.setup(m => m.info(It.isAnyString())).returns(() => Promise.resolve(info));

        let results = await this.ic.run(this.cmdDef, <IInfoCmdOpts>{}, <IInfoCmdArgs>{ templateId: "none", template: "mytmp" });

        this.errRepMock.verify<void>(x => x.reportError(TypeMoq.It.isAny()), TypeMoq.Times.never());
        this.tmplInfoMock.verify<void>(t => t.showTemplateInfo(It.is(v => _.isEqual(info, v))), Times.once());
    }

    @AsyncTest("should report any error.")
    public async run_reportsAnyError() {
        this.tmplMgrMock.setup(m => m.info(It.isAnyString())).returns(() => Promise.reject("bad"));

        let results = await this.ic.run(this.cmdDef, <IInfoCmdOpts>{}, <IInfoCmdArgs>{ templateId: "none", template: "mytmp" });

        this.tmplInfoMock.verify<void>(t => t.showTemplateInfo(It.isAny()), Times.never());
        this.errRepMock.verify<void>(x => x.reportError(TypeMoq.It.isAny()), TypeMoq.Times.once());
    }

    @TestCase(CommandErrorType.UserError, 0, true)
    @TestCase(CommandErrorType.None, 1, false)
    @AsyncTest("should return any validation error without running.")
    public async run_reportsAnyValidationError(err: CommandErrorType, n: number, isErr: boolean) {
        const r = new CommandValidationResult("bogus", err);
        this.cmdValidatorMock.reset();
        this.cmdValidatorMock.setup(m => m.validate(It.isAny(), It.isAny(), It.isAny())).returns(async () => r);

        let result = await this.ic.run(this.cmdDef, <IInfoCmdOpts>{}, <IInfoCmdArgs>{ templateId: "none", template: "mytmp" });

        Assert(result).has(r => r.IsError).that.equals(isErr);
        this.tmplInfoMock.verify<void>(t => t.showTemplateInfo(It.isAny()), Times.exactly(n));
        this.errRepMock.verify<void>(x => x.reportError(TypeMoq.It.isAny()), TypeMoq.Times.never());        
    }
}
// 3rd party imports installed via npm install
import { Test, TestFixture, AsyncTest, TestCase, AsyncSetup, AsyncTeardown } from 'alsatian';
import { Assert, MatchMode } from 'alsatian-fluent-assertions';
import { Command } from "commandpost";
import * as TypeMoq from "typemoq";
import { It, Times } from 'typemoq';
import * as _ from "lodash";

// internal imports (always a relative path beginning with a ./ or ../)
import * as i from '../../i';
import * as nci from '../i';
import { ITemplateInfo } from './i/i-template-info';
import { TemplateInfo } from './template-info';
import { ITemplate } from '../../i/template';
import { mockMessagerFactory } from '../../../spec-lib'
import { InfoCommand } from './info-command';
import { ErrorReporter } from '../../error-reporter';
import { TemplateManager } from '../../template-manager'
import { CommandValidationResult, CommandErrorType } from "../../models";

@TestFixture("Info command tests")
export class InfoCommandTests {
    ic: InfoCommand;
    cmdDef: Command<any, any>;
    errRepMock: TypeMoq.IMock<i.IErrorReporter>;
    tmplInfoMock: TypeMoq.IMock<ITemplateInfo>;
    tmplMgrMock: TypeMoq.IMock<i.ITemplateManager>;

    @AsyncSetup
    public async beforeEach() {
        this.errRepMock = TypeMoq.Mock.ofType<i.IErrorReporter>(ErrorReporter);
        this.tmplInfoMock = TypeMoq.Mock.ofType<ITemplateInfo>(TemplateInfo);
        this.tmplMgrMock = TypeMoq.Mock.ofType<TemplateManager>();
        this.cmdDef = <any>{ help: () => "" };
        this.ic = new InfoCommand(this.tmplMgrMock.object, mockMessagerFactory(),
            <NodeJS.Process>{}, <i.IPath>{}, this.errRepMock.object, this.tmplInfoMock.object);
    
        this.ic["tempDir"] = "noop";
    }

    @AsyncTeardown
    public async afterEach() {

    }

    @AsyncTest("should get template info and report it to the user.")
    public async run_reportsTemplateInfoToUser() {
        let info = <ITemplate><any>{ interesting: false };
        this.tmplMgrMock.setup(m => m.info(It.isAnyString())).returns(() => Promise.resolve(info));

        let results = this.ic.run(this.cmdDef, <nci.IInfoCmdOpts>{}, <nci.IInfoCmdArgs>{ templateId: "none", template: "mytmp" });
        return results 
            .then(() => {
                this.errRepMock.verify<void>(x => x.reportError(TypeMoq.It.isAny()), TypeMoq.Times.never());
                this.tmplInfoMock.verify<void>(t => t.showTemplateInfo(It.is(v => _.isEqual(info, v))), Times.once());
                //sinon.assert.calledWith(this.infoNoop, info);
            });
    }

    @AsyncTest("should report any error.")
    public async run_reportsAnyError() {
        this.tmplMgrMock.setup(m => m.info(It.isAnyString())).returns(() => Promise.reject("bad"));

        let results = this.ic.run(this.cmdDef, <nci.IInfoCmdOpts>{}, <nci.IInfoCmdArgs>{ templateId: "none", template: "mytmp" });
        return results 
            .then(() => {
                this.tmplInfoMock.verify<void>(t => t.showTemplateInfo(It.isAny()), Times.never());
                this.errRepMock.verify<void>(x => x.reportError(TypeMoq.It.isAny()), TypeMoq.Times.once());
            });
    }

    @AsyncTest('validate should return an error result when templateId is not defined.')
    public async validate_invalidWhenNoTemplateId() {
        //try {
        var result = await this.ic.validate(<any>{ helpText: () => "test help text" }, {}, <any>{});
        Assert(result)
            .is(CommandValidationResult)
            .has({
                ErrorType: CommandErrorType.UserError,
                Messages: m => Assert(m).hasElements([
                    /You must specify a template identifier\.[\n\r]+test help text/,
                ])
            });
        /*} catch(ex) {
            console.log(ex);
        }*/
    }
}
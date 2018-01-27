// 3rd party imports installed via npm install
import { Test, TestFixture, AsyncTest, TestCase, AsyncSetup, AsyncTeardown, Expect } from 'alsatian';
import * as sinon from 'sinon';
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

@TestFixture("Info command tests")
export class InfoCommandTests {
    ic: InfoCommand;
    cmdDef: Command<any, any>;
    tmplMgrStub: sinon.SinonStub;
    errRepMock: TypeMoq.IMock<i.IErrorReporter>;
    tmplInfoMock: TypeMoq.IMock<ITemplateInfo>;
    infoNoop: sinon.SinonSpy;

    @AsyncSetup
    public async beforeEach() {
        this.errRepMock = TypeMoq.Mock.ofType<i.IErrorReporter>(ErrorReporter);
        this.tmplInfoMock = TypeMoq.Mock.ofType<ITemplateInfo>(TemplateInfo);
        this.cmdDef = <any>{ help: () => "" };
        this.ic = new InfoCommand(<i.ITemplateManager>{}, <i.ITemplateValidator>{ }, mockMessagerFactory(),
            <NodeJS.Process>{}, <i.IPath>{}, this.errRepMock.object, this.tmplInfoMock.object);
        let vstub = sinon.stub();
        vstub.returns([]);
        this.ic["validator"].dependenciesInstalled = vstub;

        this.infoNoop = sinon.spy();
        this.tmplMgrStub = sinon.stub();

        this.ic["tempDir"] = "noop";
        this.ic["tmplMgr"].info = this.tmplMgrStub;
        this.ic["showTemplateInfo"] = this.infoNoop;
    }

    @AsyncTeardown
    public async afterEach() {

    }

    @AsyncTest("should get template info and report it to the user.")
    public async run_reportsTemplateInfoToUser() {
        let info = { interesting: false };
        this.tmplMgrStub.returns(Promise.resolve(info));

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
        this.tmplMgrStub.returns(Promise.reject("bad"));

        let results = this.ic.run(this.cmdDef, <nci.IInfoCmdOpts>{}, <nci.IInfoCmdArgs>{ templateId: "none", template: "mytmp" });
        return results 
            .then(() => {
                Expect(this.infoNoop.called).toBe(false);
                this.tmplInfoMock.verify<void>(t => t.showTemplateInfo(It.isAny()), Times.never());
                this.errRepMock.verify<void>(x => x.reportError(TypeMoq.It.isAny()), TypeMoq.Times.once());
                //sinon.assert.calledWith(this.errorNoop, "bad");
            });
    }
}
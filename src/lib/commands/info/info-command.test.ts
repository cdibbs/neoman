// 3rd party imports installed via npm install
import { Test, TestFixture, AsyncTest, TestCase, AsyncSetup, AsyncTeardown, Expect } from 'alsatian';
import * as sinon from 'sinon';
import { Command } from "commandpost";
import * as TypeMoq from "typemoq";

// internal imports (always a relative path beginning with a ./ or ../)
import * as i from '../../i';
import * as nci from '../i';
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
    infoNoop: sinon.SinonSpy;

    @AsyncSetup
    public async beforeEach() {
        this.errRepMock = TypeMoq.Mock.ofType<i.IErrorReporter>(ErrorReporter);
        this.cmdDef = <any>{ help: () => "" };
        this.ic = new InfoCommand(<i.ITemplateManager>{}, <i.ITemplateValidator>{ }, mockMessagerFactory(), <NodeJS.Process>{}, <i.IPath>{}, this.errRepMock.object);
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
                sinon.assert.calledWith(this.infoNoop, info);
            });
    }

    @AsyncTest("should report any error.")
    public async run_reportsAnyError() {
        this.tmplMgrStub.returns(Promise.reject("bad"));

        let results = this.ic.run(this.cmdDef, <nci.IInfoCmdOpts>{}, <nci.IInfoCmdArgs>{ templateId: "none", template: "mytmp" });
        return results 
            .then(() => {
                Expect(this.infoNoop.called).toBe(false);
                sinon.assert.calledWith(this.errorNoop, "bad");
            });
    }

    @Test("should handle empty properties without error")
    public showTemplateInfo_handlesEmptyProps(): void {
        Expect(() => this.ic.showTemplateInfo(<any>{}))
            .not.toThrow();            
    }

    @Test("should handle empty dependency result properties without error")
    public showTemplateInfo_handlesEmptyDependencyResultProperties(): void {
        let vstub = sinon.stub();
        vstub.returns([{ dep: "one", installed: false}, { dep: "two", installed: true }, {}]);
        this.ic["dependencies"] = vstub;
        Expect(() => this.ic.showTemplateInfo(<any>{})).not.toThrow();            
    }

    // TODO: Convert error reporting to separate class.

    @Test("should return array of dependencies from validator.")
    public dependencies_returnsArrayOfDependencies() {
        let vstub = sinon.stub();
        vstub.returns({ "one": true, "two":false});
        this.ic["validator"].dependenciesInstalled = vstub;

        let result = this.ic.dependencies(<ITemplate>{});
        Expect(result.length).toEqual(2);
        Expect(result[0]).toEqual({dep: "one", installed: true });
        Expect(result[1]).toEqual({dep: "two", installed: false });
    }
}
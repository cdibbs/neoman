// 3rd party imports installed via npm install
import { Test, TestFixture, AsyncTest, TestCase, AsyncSetup, AsyncTeardown, Expect } from 'alsatian';
import * as sinon from 'sinon';
import Command from "commandpost/lib/command";

// internal imports (always a relative path beginning with a ./ or ../)
import * as i from '../i';
import * as nci from './i';
import { ITemplate } from '../i/template';
import { mockMessagerFactory } from '../../spec-lib'
import { InfoCommand } from './info-command';

@TestFixture("Info command tests")
export class InfoCommandTests {
    ic: InfoCommand;
    cmdDef: Command<any, any>;

    @AsyncSetup
    public async beforeEach() {
        this.cmdDef = <any>{ help: () => "" };
        this.ic = new InfoCommand(<i.ITemplateManager>{}, <i.ITemplateValidator>{ }, mockMessagerFactory(), <NodeJS.Process>{}, <i.IPath>{});
        let vstub = sinon.stub();
        vstub.returns([]);
        this.ic["validator"].dependenciesInstalled = vstub;
    }

    @AsyncTeardown
    public async afterEach() {

    }

    @AsyncTest("should get template info and report it to the user.")
    public async run_reportsTemplateInfoToUser() {
        let errorNoop = sinon.spy(), infoNoop = sinon.spy();
        let tmplMgrStub = sinon.stub();
        let info = { interesting: false };
        tmplMgrStub.returns(Promise.resolve(info));

        this.ic["tempDir"] = "noop";
        this.ic["tmplMgr"].info = tmplMgrStub;
        this.ic["reportError"] = errorNoop;
        this.ic["showTemplateInfo"] = infoNoop;
        let results = this.ic.run(this.cmdDef, <nci.IInfoCmdOpts>{}, <nci.IInfoCmdArgs>{ templateId: "none", template: "mytmp" });
        return results 
            .then(() => {
                Expect(errorNoop.called).toBe(false);
                sinon.assert.calledWith(infoNoop, info);
            });
    }
}
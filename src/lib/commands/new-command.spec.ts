/// <reference path="../../../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../../../node_modules/@types/chai/index.d.ts" />
import "reflect-metadata";
import 'mocha';
import * as chai from 'chai';
import * as sinon from 'sinon';
let expect = chai.expect, assert = chai.assert;
import * as i from '../i';
import * as nci from './i';
import { mockMessagerFactory } from '../../spec-lib'

import { NewCommand } from './new-command';

describe('NewCommand', () => {
    let nc: NewCommand;
    beforeEach(() => {
        nc = new NewCommand(mockMessagerFactory(), <i.ITemplateManager>{}, <i.IPath>{ sep: "/" }, <i.ITemplateRunner>{});
    });

    describe('#run', () => {
        it('should get template info and pass required to template runner.', () => {
            let runSpy = sinon.spy(), exitNoop = sinon.spy();
            let infoSpy = sinon.stub(), optsSpy = sinon.stub();

            let info = { myProp: "info" }, opts = { path: "/my/path" };
            infoSpy.returns(Promise.resolve(info));
            optsSpy.returns(opts);
            nc["tempDir"] = "noop";
            nc["exit"] = exitNoop;
            nc["tmplMgr"] = <any>{ info: infoSpy };
            nc["trunner"] = { run: runSpy };
            nc["buildOptions"] = optsSpy;
            let results = nc.run(<nci.INewCmdOpts>{}, <nci.INewCmdArgs>{ tmplId: "none", template: "mytmp" });
            return results 
                .then(() => {
                    sinon.assert.calledWith(infoSpy, "mytmp")
                    sinon.assert.calledWith(runSpy, "/my/path", opts, info);
                });
        });

        it('exits on completion', () => {
            let runSpy = sinon.spy(), exitNoop = sinon.spy();
            let infoSpy = sinon.stub(), optsSpy = sinon.stub();

            let info = { myProp: "info" }, opts = { path: "/my/path" };
            infoSpy.returns(Promise.resolve(info));
            optsSpy.returns(opts);
            nc["tempDir"] = "noop";
            nc["exit"] = exitNoop;
            nc["tmplMgr"] = <any>{ info: infoSpy };
            nc["trunner"] = { run: runSpy };
            nc["buildOptions"] = optsSpy;
            let results = nc.run(<nci.INewCmdOpts>{}, <nci.INewCmdArgs>{ tmplId: "none", template: "" });
            return results 
                .then(() => {
                    sinon.assert.calledOnce(exitNoop);
                });
        });

        it('exits on error', () => {
            let runSpy = sinon.spy(), exitNoop = sinon.spy();
            let infoSpy = sinon.stub(), optsSpy = sinon.stub();

            let info = { myProp: "info" }, opts = { path: "/my/path" };
            infoSpy.returns(Promise.reject("bogus error"));
            optsSpy.returns(opts);
            nc["tempDir"] = "noop";
            nc["exit"] = exitNoop;
            nc["tmplMgr"] = <any>{ info: infoSpy };
            nc["trunner"] = { run: runSpy };
            nc["buildOptions"] = optsSpy;
            let results = nc.run(<nci.INewCmdOpts>{}, <nci.INewCmdArgs>{ tmplId: "none", template: "" });
            return results 
                .then(() => {
                    sinon.assert.calledOnce(exitNoop);
                });
        });
    });

    describe("#buildOptions", () => {
        it("survives an empty object", () => {
            let result = nc.buildOptions(<any>{});
        });
    });

    describe('#exit', () => {
        it('should call process.exit', () => {
            let exitStub = sinon.stub();
            nc["process"].exit = <any>exitStub;

            nc["exit"]();

            expect(exitStub.called).to.be.true;            
        });
    });
});
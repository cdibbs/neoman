/// <reference path="../../../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../../../node_modules/@types/chai/index.d.ts" />
import "reflect-metadata";
import 'mocha';
import * as chai from 'chai';
import * as sinon from 'sinon';
let expect = chai.expect, assert = chai.assert;
import * as i from '../i';
import * as nci from './i';
import { ITemplate } from '../i/template';

import { InfoCommand } from './info-command';

describe('InfoCommand', () => {
    let ic: InfoCommand;
    beforeEach(() => {
        let userMessager: i.IUserMessager = {
            info: (message: any, indent?: number): void => {},
            debug: (message: any, indent?: number): void => {},
            warn: (message: any, indent?: number): void => {},
            error: (message: any, indent?: number): void => {},
            write: (message: string, indent: number = 0, level: i.Levels = i.LEVELS.Debug): void => {}
        };
        ic = new InfoCommand(<i.ITemplateManager>{}, <i.ITemplateValidator>{ }, userMessager, <NodeJS.Process>{}, <i.IPath>{});
        let vstub = sinon.stub();
        vstub.returns([]);
        ic["validator"].dependenciesInstalled = vstub;
    });

    describe('#run', () => {
        it('should get template info and report it to the user.', () => {
            let errorNoop = sinon.spy(), infoNoop = sinon.spy();
            let tmplMgrStub = sinon.stub();
            let info = { interesting: false };
            tmplMgrStub.returns(Promise.resolve(info));

            ic["tempDir"] = "noop";
            ic["tmplMgr"].info = tmplMgrStub;
            ic["reportError"] = errorNoop;
            ic["showTemplateInfo"] = infoNoop;
            let results = ic.run(<nci.IInfoCmdOpts>{}, <nci.IInfoCmdArgs>{ tmplId: "none", template: "mytmp" });
            return results 
                .then(() => {
                    expect(errorNoop.called).to.be.false;
                    sinon.assert.calledWith(infoNoop, info)
                });
        });

        it('should catch and report any error.', () => {
            let errorNoop = sinon.spy(), infoNoop = sinon.spy();
            let tmplMgrStub = sinon.stub();
            tmplMgrStub.returns(Promise.reject("bad"));

            ic["tempDir"] = "noop";
            ic["tmplMgr"].info = tmplMgrStub;
            ic["reportError"] = errorNoop;
            ic["showTemplateInfo"] = infoNoop;
            let results = ic.run(<nci.IInfoCmdOpts>{}, <nci.IInfoCmdArgs>{ tmplId: "none", template: "mytmp" });
            return results 
                .then(() => {
                    expect(infoNoop.called).to.be.false;
                    sinon.assert.calledWith(errorNoop, "bad");
                });
        });
    });

    describe("#showTemplateInfo", () => {
        it("should handle empty properties without error", () => {
            assert.doesNotThrow(() => ic.showTemplateInfo(<any>{}));            
        });
        it("should handle empty dependency properties without error", () => {
            let vstub = sinon.stub();
            vstub.returns([{ dep: "one", installed: false}, { dep: "two", installed: true }, {}]);
            ic["dependencies"] = vstub;
            assert.doesNotThrow(() => ic.showTemplateInfo(<any>{}));            
        });
    });

    describe("#dependencies", () => {
        it("should return list of deps from validator as array", () => {
            let vstub = sinon.stub();
            vstub.returns({ "one": true, "two":false});
            ic["validator"].dependenciesInstalled = vstub;
            let result = ic.dependencies(<ITemplate>{});
            expect(result.length).to.equal(2);
            expect(result[0]).to.deep.equal({dep: "one", installed: true });
            expect(result[1]).to.deep.equal({dep: "two", installed: false });
        });
    });

    describe("#reportError", () => {
        it("should show the stack, if a proper Error.", () => {
            let spy = sinon.spy();
            ic["msg"].error = spy;
            let e = new Error();
            e.stack = "mymessage";
            ic.reportError(e);
            expect(spy.called);
            sinon.assert.calledWith(spy, e.stack);
        });
        it("should show the message, if string.", () => {
            let spy = sinon.spy();
            ic["msg"].error = spy;
            let e = "string message";
            ic.reportError(<any>e);
            expect(spy.called);
            sinon.assert.calledWith(spy, e);
        });
    });
});
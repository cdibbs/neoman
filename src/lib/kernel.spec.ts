/// <reference path="../../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../../node_modules/@types/chai/index.d.ts" />
import "reflect-metadata";
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as sinon from 'sinon';
let expect = chai.expect, assert = chai.assert;
let NestedError = require('nested-error-stacks');

import { Kernel } from './kernel';
import { mockMessagerFactory, mockSettingsProviderFactory } from '../spec-lib';
import * as i from './i';
import * as ic from './commands/i';
import * as itmp from './i/template';

describe(Kernel.name, () => {
    let msg: i.IUserMessager, sp: i.ISettingsProvider;
    let exitStub: sinon.SinonStub, i18nStub: sinon.SinonStub, cbStub: sinon.SinonStub;
    let errStub: sinon.SinonStub, cstub: sinon.SinonStub;
    let cf: ic.ICommandFactory;
    let p: NodeJS.Process;
    let pckg: any;
    let k: Kernel;

    before(() => {
        chai.should();
        chai.use(chaiAsPromised);
    });

    beforeEach(() => {
        msg = mockMessagerFactory();
        exitStub = sinon.stub(), errStub = sinon.stub();
        i18nStub = sinon.stub(), cbStub = sinon.stub();
        cstub = sinon.stub();
        i18nStub.returns("a string");
        cbStub.returns({ run: cstub });
        msg.error = errStub;
        p = <any>{ exit: exitStub, argv: [] };
        pckg = <any>{ version: "1.0" };
        cf = <any>{ build: cbStub };
        sp = mockSettingsProviderFactory();
        k = new Kernel(msg, p, sp, pckg, cf, i18nStub);
    });

    describe('#Go', () => {
        it('should run without error', () => {
            expect(() => {
                k.Go();
            }).not.to.throw();
            let firstErr = errStub.args[0] || [];
            expect(firstErr[0]).to.be.undefined;
        });

        it('should gracefully handle a hitherto unexpected error', () => {
            let hstub = sinon.stub(), cpstub = sinon.stub();
            let merr = new Error("membrain");
            cpstub.throws(merr);
            k["commandpost"].exec = cpstub;
            k["handleError"] = hstub;
            k.Go();
            sinon.assert.calledWith(hstub, merr);
        })
    });

    describe('#handleError', () => {
        it('should wrap the error to ensure the user gets something', () => {
            k.handleError(new Error());
            sinon.assert.calledWith(errStub, sinon.match.instanceOf(NestedError));
        });

        it('should exit', () => {
            k.handleError(new Error());
            sinon.assert.calledWith(exitStub, 1);
        });
    });
});
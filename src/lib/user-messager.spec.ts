/// <reference path="../../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../../node_modules/@types/chai/index.d.ts" />
import { Stats } from 'fs';
import "reflect-metadata";
import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as sinon from 'sinon';
let expect = chai.expect, assert = chai.assert;

import { UserMessager } from './user-messager';
import { LEVELS } from './i';
import { PLUGIN_PREFIX } from './constants';
import * as i from './i';
import * as itmp from './i/template';

describe(UserMessager.name, () => {
    let t: UserMessager;
    let mf: sinon.SinonStub;
    let logstub: sinon.SinonStub, warnstub: sinon.SinonStub;
    let errorstub: sinon.SinonStub;
    before(() => {
        chai.should();
        chai.use(chaiAsPromised);
    });

    beforeEach(() => {
        logstub = sinon.stub(), warnstub = sinon.stub(), errorstub = sinon.stub();
        mf = sinon.stub();
        t = new UserMessager(mf);
        t["console"] = <any>{
            log: logstub,
            warn: warnstub,
            error: errorstub
        };
    });

    describe('#write', () => {
        it('returns self', () => {
            let newt = t.write("");
            expect(newt === t).to.be.true;
        });

        it('formats message with i18n when usei18n true', () => {
            let retval = "something";
            mf.returns(retval);
            t["usei18n"] = true;
            t["mfDict"] = { something: 1 };
            t.write("message");
            sinon.assert.calledWith(mf, "message", t["mfDict"]);
            sinon.assert.calledWith(logstub, retval);
        });

        it('switches to debug', () => {
            t.write("message", 0, LEVELS.Debug);
            sinon.assert.calledWith(logstub, "message");
            expect(logstub.calledTwice).to.be.false;
            expect(warnstub.called).to.be.false;
            expect(errorstub.called).to.be.false;
        });

        it('switches to info', () => {
            t.write("message", 0, LEVELS.Info);
            sinon.assert.calledWith(logstub, "message");
            expect(logstub.calledTwice).to.be.false;
            expect(warnstub.called).to.be.false;
            expect(errorstub.called).to.be.false;
        });

        it('switches to warn', () => {
            t.write("message", 0, LEVELS.Warn);
            sinon.assert.calledWith(warnstub, "message");
            expect(logstub.called).to.be.false;
            expect(warnstub.calledTwice).to.be.false;
            expect(errorstub.called).to.be.false;
        });

        it('switches to error', () => {
            t.write("message", 0, LEVELS.Error);
            sinon.assert.calledWith(errorstub, "message");
            expect(logstub.called).to.be.false;
            expect(warnstub.called).to.be.false;
            expect(errorstub.calledTwice).to.be.false;
        });

        it('throws on bad log level', () => {
            expect(() => {
                t.write("message", 0, <any>"asdf");
            }).to.throw();
        });
    });

    describe('#i18n', () => {
        it('returns new instance of self with i18n enabled', () => {
            let dict = { mykey: 1 };
            let result = t.i18n(dict);
            expect(result["__mf"]).to.equal(mf);
            expect(result["usei18n"]).to.be.true;
            expect(result["mfDict"].mykey).to.equal(dict.mykey);
        });
    });

    describe('#mf', () => {
        it('should pass correct state to i18n __mf library call', () => {
            let stub = sinon.stub();
            let obj = { hi: "hi" };
            t.__mf = stub;
            t["mfDict"] = obj;

            t.mf("message");

            sinon.assert.calledWith(stub, "message", obj);
        });
    });

    describe('(helpers)', () => {
        let wstub: sinon.SinonStub;
        beforeEach(() => {
            wstub = sinon.stub();
            t["write"] = wstub;
        });

        it('#info should delegate to write', () => {
            let r = t.info("one", 3);
            sinon.assert.calledWith(wstub, "one", 3, LEVELS.Info);
            expect(r === t).to.be.true;
        });

        it('#debug should delegate to write', () => {
            let r = t.debug("one", 3);
            sinon.assert.calledWith(wstub, "one", 3, LEVELS.Debug);
            expect(r === t).to.be.true;
        });

        it('#warn should delegate to write', () => {
            let r = t.warn("one", 3);
            sinon.assert.calledWith(wstub, "one", 3, LEVELS.Warn);
            expect(r === t).to.be.true;
        });

        it('#error should delegate to write', () => {
            let r = t.error("one", 3);
            sinon.assert.calledWith(wstub, "one", 3, LEVELS.Error);
            expect(r === t).to.be.true;
        });
    });
});
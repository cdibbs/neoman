/// <reference path="../../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../../node_modules/@types/chai/index.d.ts" />
import "reflect-metadata";
import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as sinon from 'sinon';
let expect = chai.expect, assert = chai.assert;

import { SettingsProvider } from './settings-provider';
import { PLUGIN_PREFIX } from './constants';
import * as i from './i';
import * as itmp from './i/template';

describe(SettingsProvider.name, () => {
    let sp: SettingsProvider;
    let usfstub: sinon.SinonStub, getstub: sinon.SinonStub, setstub: sinon.SinonStub;
    let settings: any;
    before(() => {
        chai.should();
        chai.use(chaiAsPromised);
    });

    beforeEach(() => {
        usfstub = sinon.stub(), getstub = sinon.stub(), setstub = sinon.stub();
        settings = { get: getstub, set: setstub };
        usfstub.returns(settings);
        SettingsProvider.userSettings = { file: usfstub };
        sp = new SettingsProvider();
    });

    describe('constructor', () => {
        it('should load the user settings', () => {
            expect(sp["settings"]).to.deep.equal(settings);
        });
    });

    describe('#get', () => {
        it('should get the user setting', () => {
            getstub.withArgs("mysetting").returns(123);
            let result = sp.get("mysetting");
            expect(result).to.equal(123);
        });

        it('should not error on missing setting', () => {
            expect(() => {
                sp.get("dne");
            }).not.to.throw();
        });
    });

    describe('#set', () => {
        it('should set a user setting', () => {
            sp.set("mysetting", "neat");
            sinon.assert.calledWith(setstub, "mysetting", "neat");
        });
    });
});
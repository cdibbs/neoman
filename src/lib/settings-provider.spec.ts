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
import { mockPathFactory, mockFSFactory } from '../spec-lib';
import { Settings } from './models';
import KEYS from './settings-keys';

describe(SettingsProvider.name, () => {
    let sp: SettingsProvider<Settings>;
    let usfstub: sinon.SinonStub, getstub: sinon.SinonStub, setstub: sinon.SinonStub;
    let settings: any;
    let proc: NodeJS.Process;
    before(() => {
        chai.should();
        chai.use(chaiAsPromised);
    });

    beforeEach(() => {
        proc = <NodeJS.Process><any>{ env: { HOME: "/tmp" } };
        var fs = mockFSFactory();
        var path = mockPathFactory();
        sp = new SettingsProvider(Settings, proc, fs, path);
    });

    describe('constructor', () => {
        it('should correctly set the filepath under *nix/mac', () => {
            expect(sp["filepath"]).to.deep.equal("/tmp/.neoman-settings");
        });
        it('should correctly set the filepath under windows', () => {
            var proc = <NodeJS.Process><any>{ env: { USERPROFILE: "c:\\temp" } };
            var path = mockPathFactory("\\");
            sp = new SettingsProvider(Settings, proc, mockFSFactory(), path);
            expect(sp["filepath"]).to.deep.equal("c:\\temp\\.neoman-settings");
        });
    });

    describe('#get', () => {
        let readFileStub: sinon.SinonStub;
        let writeFileStub: sinon.SinonStub;
        beforeEach(() => {
            readFileStub = sinon.stub();
            writeFileStub = sinon.stub();
            readFileStub.returns(
                { templateDirectory: "something"}
            );
            sp.readFileJSON = readFileStub;
        });

        it('should get the user setting', () => {
            let result = sp.get(KEYS.tempDirKey);
            expect(result).to.equal("something");
        });

        it('should not error on missing setting', () => {
            expect(() => {
                sp.get("dne");
            }).not.to.throw();
        });
    });

    describe('#set', () => {
        let readFileStub: sinon.SinonStub;
        let writeFileStub: sinon.SinonStub;
        beforeEach(() => {
            readFileStub = sinon.stub();
            writeFileStub = sinon.stub();
            readFileStub.returns(
                { templateDirectory: "something"}
            );
            sp.readFileJSON = readFileStub;
            sp["fs"].writeFileSync = writeFileStub
        });

        it('should set a user setting', () => {
            sp.set("templateDirectory", "neat");
            sinon.assert.calledWith(writeFileStub, proc.env.HOME + "/.neoman-settings", JSON.stringify({ templateDirectory: "neat" }, null, 2));
        });
    });
});
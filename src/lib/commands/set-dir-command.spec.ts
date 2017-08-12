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
import { mockMessagerFactory } from '../../spec-lib'

import { SetDirCommand } from './set-dir-command';

describe('SetDirCommand', () => {
    let c: SetDirCommand;
    beforeEach(() => {
        c = new SetDirCommand(mockMessagerFactory(), <NodeJS.Process>{}, <i.ISettingsProvider>{}, <i.IFileSystem>{ }, <i.IPath>{});
        let resolveSpy = sinon.spy();
        c["path"] = <any>{ resolve: resolveSpy };
    });

    describe('#run', () => {
        it('should warn when not a directory.', () => {
            let settingsSpy = sinon.spy(), warnSpy = sinon.spy();
            let statSync = sinon.stub();
            let stats = { isDirectory: (): boolean => false };
            statSync.returns(stats)

            c["fs"].statSync = statSync;
            c["settings"].set = settingsSpy;
            c["msg"]["console"] = { warn: warnSpy, log: c["msg"]["console"].log, error: c["msg"]["console"].warn };
            let opts = {}, args = { directory: "test" };
            let result = c.run(opts, args);
            sinon.assert.calledWith(warnSpy, `Warning: Not a directory: '${args.directory}'.`);
        });

        it('should not warn when directory and set settings.', () => {
            let settingsSpy = sinon.spy(), warnSpy = sinon.spy();
            let statSync = sinon.stub();
            let stats = { isDirectory: (): boolean => true };
            statSync.returns(stats)

            c["fs"].statSync = statSync;
            c["settings"].set = settingsSpy;
            c["msg"]["console"] = { warn: warnSpy, log: c["msg"]["console"].log, error: c["msg"]["console"].warn };
            let opts = {}, args = { directory: "test" };
            let result = c.run(opts, args);
            expect(warnSpy.called).to.be.false;
            expect(settingsSpy.called).to.be.true;
        });

        it('should catch, warn and not set settings when stat error.', () => {
            let settingsSpy = sinon.spy(), warnSpy = sinon.spy();
            let statSync = sinon.stub();
            statSync.throws("bad");

            c["fs"].statSync = statSync;
            c["settings"].set = settingsSpy;
            c["msg"]["console"] = { warn: warnSpy, log: c["msg"]["console"].log, error: c["msg"]["console"].warn };
            let opts = {}, args = { directory: "test" };
            let result = c.run(opts, args);
            expect(warnSpy.called).to.be.true;
            expect(settingsSpy.called).to.be.false;
        });
    });
});
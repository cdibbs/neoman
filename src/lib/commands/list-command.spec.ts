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

import { ListCommand } from './list-command';

describe('ListCommand', () => {
    let c: ListCommand;
    beforeEach(() => {
        c = new ListCommand(mockMessagerFactory(), <NodeJS.Process>{}, <i.IFileSystem>{ }, <i.IPath>{}, <i.IGlob>{});
        c.tempDir = "/tmp/mytemplates";
    });

    describe('#run', () => {
        it('should set the Glob to use tempDir, and bind match and end', () => {
            let onSpy = sinon.spy(), bindStub = sinon.stub();
            let globStub = sinon.stub();
            globStub.returns({ on: onSpy});
            bindStub.withArgs(c.match).returns(c.match);
            bindStub.withArgs(c.end).returns(c.end);

            c["glob"].Glob = <any>globStub;
            c["bind"] = bindStub;
            let opts = {}, args = {};
            let result = c.run(opts, args);
            sinon.assert.calledWith(globStub, c.neomanPath, { cwd: c.tempDir });
            sinon.assert.calledWith(onSpy, "match", c.match);
            sinon.assert.calledWith(onSpy, "end", c.end);
        });
    });

    describe("#match", () => {
        it('should catch errors and exit process.', () => {
            let exitSpy = sinon.spy();
            let readFileSyncStub = sinon.stub(), joinStub = sinon.stub();
            readFileSyncStub.throws("bad");
            joinStub.returns("/tmp/templates/myfile.txt");
            c["path"].join = joinStub;
            c["process"].exit = <any>exitSpy;
            c["fs"].readFileSync = <any>readFileSyncStub;
            c.match("myfile.txt");
            expect(exitSpy.called).to.be.true;
            sinon.assert.calledWith(exitSpy, 1);
        });

        it('should not error on reading valid JSON.', () => {
            let exitSpy = sinon.spy();
            let readFileSyncStub = sinon.stub(), joinStub = sinon.stub();
            readFileSyncStub.returns("{}");
            joinStub.returns("/tmp/templates/myfile.txt");
            c["path"].join = joinStub;
            c["process"].exit = <any>exitSpy;
            c["fs"].readFileSync = <any>readFileSyncStub;
            c.match("myfile.txt");
            expect(exitSpy.called).to.be.false;
        });
    });

    describe("#end", () => {
        beforeEach(() => {
            c.resolve = sinon.stub();
        });
        it('should not error.', () => {
            assert.doesNotThrow(() => c.end(["one", "two"]));
            assert.doesNotThrow(() => c.end([]));
            assert.doesNotThrow(() => c.end(null));
        });
    });

    describe('#bind', () => {
        it('should bind', () => {
            let fn = function() { return this; };
            let bfn = c.bind(fn);
            expect(bfn()).to.equal(c);
        });
    });
});

/// <reference path="../../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../../node_modules/@types/chai/index.d.ts" />
import { Stats } from 'fs';
import "reflect-metadata";
import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as sinon from 'sinon';
let expect = chai.expect, assert = chai.assert;

import { EventEmitter, TemplateFilesEmitterType, TemplateSearchEmitterType } from './emitters';
import * as iemitters from './emitters/i';
import { TemplateManager } from './template-manager';
import { RunOptions, RunnerResult } from './models';
import { VERBOSITY, Verbosity } from './types/verbosity';
import * as i from './i';
import * as itmp from './i/template';
import * as itm from './transformers/i';
import { mockMessagerFactory, mockPathFactory, mockSettingsProviderFactory, mockFSFactory, mockGlobFactory } from '../spec-lib';

describe(TemplateManager.name, () => {
    var tm: TemplateManager;
    var sp: i.ISettingsProvider;
    before(() => {
        chai.should();
        chai.use(chaiAsPromised);
    });

    beforeEach(() => {
        sp = mockSettingsProviderFactory();
        tm = new TemplateManager(sp, mockMessagerFactory(), mockFSFactory(), mockPathFactory(), mockGlobFactory());
    });

    describe(`#${TemplateManager.prototype["list"].name} partial integration test`, () => {
        it('should return an emitter that emits an ITemplate on glob match', () => {
            let gstub = sinon.stub(), onStub = sinon.stub(), errStub = sinon.stub();
            let ematchStub = sinon.stub(), eendStub = sinon.stub();
            let fakeGlobEmitter = new EventEmitter<{match: string, end: string}>();
            gstub.returns(fakeGlobEmitter);
            tm["glob"] = <any>{ Glob: gstub };
            tm["fs"].readFileSync = () => '{ "some" : "json" }';
            tm["fs"].statSync = () => { return <any>{ isDirectory: true }; };

            let emitter = tm["list"]();
            emitter.on('match', ematchStub);
            emitter.on('end', eendStub);
            emitter.on('error', errStub);
            fakeGlobEmitter.emit('match', 'one.txt');
            fakeGlobEmitter.emit('match', 'two.txt');
            fakeGlobEmitter.emit('end', undefined);

            expect(errStub.called).to.be.false;
            expect(gstub.calledOnce).to.be.true;
            expect(gstub.calledTwice).to.be.false;
            expect(ematchStub.calledTwice).to.be.true;
            expect(ematchStub.calledThrice).to.be.false;
            expect(eendStub.calledOnce).to.be.true;
            expect(eendStub.calledTwice).to.be.false;
            expect(eendStub.args[0][0]).to.have.lengthOf(2);
        });
    });

    describe(TemplateManager.prototype.info.name, () => {
        let emitterOnStub: sinon.SinonStub, emitter: EventEmitter<TemplateSearchEmitterType>;
        let listStub: sinon.SinonStub, infoFoundStub: sinon.SinonStub, infoErrorStub: sinon.SinonStub;
        beforeEach(() => {
            emitterOnStub = sinon.stub();
            emitter = <any>{
                on: emitterOnStub
            };
            listStub = sinon.stub(), infoFoundStub = sinon.stub(), infoErrorStub = sinon.stub();
            listStub.returns(emitter);
            tm["list"] = listStub;
            tm["infoFound"] = infoFoundStub;
            tm["infoError"] = infoErrorStub;
        });

        it('should delegate "end" and "error" events to curried infoFound', () => {
            let promise = tm["info"]("myid");

            sinon.assert.calledWith(emitterOnStub, "end", sinon.match.func);
            sinon.assert.calledWith(emitterOnStub, "error", sinon.match.func);
            let endfn = emitterOnStub.args[0][1];
            let errfn = emitterOnStub.args[1][1];
            endfn([]);
            errfn("an error!");
            sinon.assert.calledWith(infoFoundStub, sinon.match.func, "myid", []);
            sinon.assert.calledWith(infoErrorStub, sinon.match.func, "an error!");
        });
    });

    describe(TemplateManager.prototype["infoError"].name, () => {
        it('should reject with the given error', () => {
            let rejStub = sinon.stub();
            let err = new Error("oops");

            tm["infoError"](rejStub, err);

            sinon.assert.calledWith(rejStub, err);
        });
    });

    describe(TemplateManager.prototype["infoFound"].name, () => {
        it('should resolve with a mapped first match', () => {
            let resStub = sinon.stub(), mapStub = sinon.stub();
            let mapRet = {};
            mapStub.returns(mapRet);
            tm["mapToViewModel"] = mapStub;
            let tmpls = [
                { identity: "notmyid" },
                { identity: "myid" }
            ];

            tm["infoFound"](resStub, "myid", <any>tmpls);

            sinon.assert.calledWith(resStub, sinon.match.same(mapRet));
            sinon.assert.calledWith(mapStub, sinon.match.same(tmpls[1]));
        });
    });

    describe(TemplateManager.prototype["endList"].name, () => {
        it('should emit all found templates', () => {
            let tr: any[] = [ "blerg" ];
            let emitStub = sinon.stub();
            let emitter = { emit: emitStub };

            tm["endList"](tr, <any>emitter);

            sinon.assert.calledWith(emitStub, 'end', tr);
        });
    });

    describe(TemplateManager.prototype["listMatch"].name, () => {
        it('should push onto templateRef', () => {
            let tr: any[] = [], tmp = { "fake": "template" };

            tm["listMatch"](tr, <any>tmp);

            expect(tr).to.contain(tmp);
        });
    });

    describe(TemplateManager.prototype["mapToViewModel"].name, () => {
        it('should strip comments', () => {
            let scStub = sinon.stub();
            let scRv = { "fake": "template" };
            scStub.returns(scRv);
            let tmp = { "fake": "template", "#": "comment" };
            tm["stripComments"] = scStub;

            let rv = tm["mapToViewModel"](<any>tmp);

            sinon.assert.calledWith(scStub, tmp);
            expect(rv).to.deep.equal(scRv);
        });
    });

    describe(TemplateManager.prototype["stripComments"].name, () => {
        it('should throw if root is array', () => {
            expect(() => {
                tm["stripComments"]([], null, null);
            }).to.throw().property("message").contains("Root").contains("cannot be an array");
        });

        it('should remove all object comments', () => {
            let input = {
                "#" : "a comment",
                "# not": "a comment",
                "nesting": {
                    "nested": "# not a comment",
                    "#" : "a comment",
                },
                "another": {
                    "#": [ "array comment" ]
                },
                "again": {
                    "#": { "object" : "comment" }
                }
            };

            let result = tm["stripComments"](input, null, null);

            expect(result).to.deep.equal({
                "# not": "a comment",
                "nesting": {
                    "nested": "# not a comment"
                },
                "another": {},
                "again": {}
            });
        });

        it('should remove all array comments', () => {
            let input = {
                "array": [ "# a comment", "not a comment", "not # a comment", "" ]
            };

            let result = tm["stripComments"](input, null, null);

            expect(result).to.deep.equal({
                "array": [ "not a comment", "not # a comment", "" ]
            })
        });
    });

    describe(TemplateManager.prototype["templateMatch"].name, () => {
        let rfsStub: sinon.SinonStub, eemitStub: sinon.SinonStub, dirnameStub: sinon.SinonStub;
        let emitter: EventEmitter<TemplateSearchEmitterType>;
        beforeEach(() => {
            rfsStub = sinon.stub(), eemitStub = sinon.stub(), dirnameStub = sinon.stub();
            emitter = <any>{ emit: eemitStub };
            tm['path'].dirname = dirnameStub;
            tm['fs'].readFileSync = rfsStub;
            tm["fs"].statSync = () => { return <any>{ isDirectory: true }; };
        });
        it('should load and parse json contents by full path', () => {
            let json = '{ "some": "json" }';
            rfsStub.returns(json);
            tm["tmplDir"] = "/tmp/fullpath";

            tm["templateMatch"](emitter, "myfile.txt");

            sinon.assert.calledWith(rfsStub, "/tmp/fullpath/myfile.txt", "utf8");
            expect(eemitStub.calledWith("error", sinon.match.any)).to.be.false;
        });
        it('should emit match with relative path', () => {
            let json = '{ "some": "json" }';
            rfsStub.returns(json);
            dirnameStub.returns("/tmp/fullpath/sometmpl/.neoman.config");
            tm["tmplDir"] = "/tmp/fullpath";

            tm["templateMatch"](emitter, "sometmpl/.neoman.config/template.json");

            sinon.assert.calledWith(dirnameStub, "/tmp/fullpath/sometmpl/.neoman.config/template.json");
            sinon.assert.calledWith(eemitStub, "match", {
                "some": "json",
                "__tmplConfigPath": "/tmp/fullpath/sometmpl/.neoman.config/..",
                "__tmplPath": "/tmp/fullpath/sometmpl/.neoman.config/.." });
            expect(eemitStub.calledWith("error", sinon.match.any)).to.be.false;
        });

        it('should emit match with config-adjusted relative path', () => {
            let json = '{ "some": "json", "root": "./subdirectory" }';
            rfsStub.returns(json);
            dirnameStub.returns("/tmp/fullpath/sometmpl/.neoman.config");
            tm["tmplDir"] = "/tmp/fullpath";

            tm["templateMatch"](emitter, "sometmpl/.neoman.config/template.json");

            sinon.assert.calledWith(dirnameStub, "/tmp/fullpath/sometmpl/.neoman.config/template.json");
            sinon.assert.calledWith(eemitStub, "match", {
                "some": "json",
                "root": "./subdirectory",
                "__tmplConfigPath": "/tmp/fullpath/sometmpl/.neoman.config/..",
                "__tmplPath": "/tmp/fullpath/sometmpl/.neoman.config/.././subdirectory" });
            expect(eemitStub.calledWith("error", sinon.match.any)).to.be.false;
        });

        it('should emit error with exception', () => {
            let err = new Error("my error message");
            rfsStub.throws(err);

            tm["templateMatch"](emitter, "sometmpl/.neoman.config/template.json");

            sinon.assert.calledWith(eemitStub, "error", err);
        });
    });
});
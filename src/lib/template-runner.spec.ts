/// <reference path="../../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../../node_modules/@types/chai/index.d.ts" />
import { Stats } from 'fs';
import "reflect-metadata";
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as sinon from 'sinon';
let expect = chai.expect, assert = chai.assert;

import { EventEmitter, TemplateFilesEmitterType } from './emitters';
import { TemplateRunner } from './template-runner';
import { RunOptions } from './models';
import * as i from './i';
import * as itmp from './i/template';
import * as itm from './transformers/i';

describe('TemplateRunner', () => {
    var tr: TemplateRunner;
    before(() => {
        chai.should();
        chai.use(chaiAsPromised);
    });


    beforeEach(() => {
        let filePatterns: i.IFilePatterns = {
            match(path: string, patterns: string[]): string[] {
                return [];
            }
        };
        let userMessager: i.IUserMessager = {
            info: (message: any, indent?: number): void => {},
            debug: (message: any, indent?: number): void => {},
            warn: (message: any, indent?: number): void => {},
            error: (message: any, indent?: number): void => {},
            write: (message: string, indent: number = 0, level: i.Levels = i.LEVELS.Debug): void => {}
        };
        let fs: i.IFileSystem = {
            readdirSync: (...args: any[]) => [],
            statSync: (...args: any[]) => <Stats>{},
            readFileSync: (...args: any[]) => ""
        };
        let path: i.IPath = {
            sep: "/",
            join: (...args: any[]) => args.join(this.sep),
            dirname: (...args: any[]) => "",
            resolve: () => ""
        };
        let patterns: i.IFilePatterns = {
            match: (path: string, patterns: string[]) => []
        };
        let im: i.IInputManager = {
            ask: (inputs: itmp.IInputConfig) => new Promise((resolve) => resolve(<{[k: string]: any}>{}))
        };
        let tm: itm.ITransformManager = {
            configure: () => "",
            applyTransforms: () => ""
        };
        let ptm: itm.IPathTransformManager = {
            configure: () => "",
            applyTransforms: () => ""
        };
        let v: i.ITemplateValidator = {
            dependenciesInstalled: (tmpl: itmp.ITemplate) => { return {}; }
        };
        tr = new TemplateRunner(userMessager, fs, path, patterns, im, tm, ptm, v);
    })

    describe("#getUserInputAndRun", () => {
        it('should pass inputConfig to inputManager', () => {
            let callback = sinon.stub();
            callback.onCall(0).returns(Promise.resolve({}));
            tr["inputManager"]["ask"] = callback;
            tr["andRun"] = () => Promise.resolve(1);
            tr["finishRun"] = () => 1;
            let opts = new RunOptions();
            let tmpl = <itmp.ITemplate>{
                __tmplPath: "",
                identity: "",
                name: "",
                inputConfig: { }
            };
            let result = tr["getUserInputAndRun"]("path", opts, tmpl);
            expect(callback.called).to.be.true;
            sinon.assert.calledWith(callback, sinon.match.same(tmpl.inputConfig));
            expect(result).to.eventually.equal(1);
        });
    });
    
    describe('#run', () => {
        it('should ask user input when valid and dest dir empty.', () => {
            tr['validate'] = () => true;
            tr['destinationEmpty'] = () => true;
            tr['getUserInputAndRun'] = () => Promise.resolve(314);
            let result = tr.run("", new RunOptions(), <itmp.ITemplate>{});
            return result.should.eventually.equal(314);
        });

        it('should return rejected promise when template config not valid.', () => {
            tr['validate'] = () => false;
            let result = tr.run("", new RunOptions(), <itmp.ITemplate>{});
            return result.should.eventually.be.rejected;
        });

        it('should return rejected promise when destination directory not empty.', () => {
            tr['validate'] = () => true;
            tr['destinationEmpty'] = () => false;
            let result = tr.run("", new RunOptions(), <itmp.ITemplate>{});
            return result.should.eventually.be.rejected;
        });
    });

    describe("#getFileInfo", () => {
        let em: EventEmitter<TemplateFilesEmitterType>;

        beforeEach(() => {
            em = <EventEmitter<TemplateFilesEmitterType>>{
                emit: (ev, err) => {}
            };
        });

        it('should stat the joined file + base path', (done) => {
            let f = "one";
            let p = "two/";
            tr["path"].join = (a, b) => a + b;
            tr["stat"] = (result) => { expect(result).to.equal(p + f); done(); return Promise.resolve(<Stats>{}); };
            tr["prepareFileInfo"] = (...args: any[]) => <i.ITemplateFile>{};
            tr["handleFileInfo"] = (...args: any[]) => 1;
            tr["getFileInfo"](p, p, [], [], em, f)
        });
        it('should emit error when error', (done) => {
            let em = <EventEmitter<TemplateFilesEmitterType>>{
                emit: ((ev, err) => {
                    expect(ev).to.equal("error");
                    expect(err).to.equal("bogus");
                    done();
                })
            };
            tr["stat"] = (result) => Promise.reject("bogus");
            tr["getFileInfo"]("", "", [], [], em, "");
        });
        it('should properly curry prepareFileInfo', (done) => {
            let stats = <Stats>{};
            tr["prepareFileInfo"] = (baseDir, p, include, ignore, emitter) =>
            {
                try {
                    expect(this).to.equal(tr);
                    expect(baseDir).to.equal("a");
                    expect(p).to.equal("a");
                    expect(include).to.deep.equal(["c"]);
                    expect(ignore).to.deep.equal(["d"]);
                    expect(emitter).to.equal(em);
                } finally {
                    done();
                    return <i.ITemplateFile>{};
                }
            };
            tr["stat"] = () => Promise.resolve(stats);
            tr["getFileInfo"]("a", "b", ["c"], ["d"], em, "");
        });
        it('should properly curry handleFileInfo', (done) => {
            let stats = <Stats>{};
            tr["prepareFileInfo"] = () => <i.ITemplateFile>{};
            tr["handleFileInfo"] = (baseDir, p, include, ignore, emitter) =>
            {
                try {
                    expect(this).to.equal(tr);
                    expect(baseDir).to.equal("a");
                    expect(p).to.equal("a");
                    expect(include).to.deep.equal(["c"]);
                    expect(ignore).to.deep.equal(["d"]);
                    expect(emitter).to.equal(em);
                } finally {
                    done();
                    return 1;
                }
            };
            tr["stat"] = () => Promise.resolve(stats);
            tr["getFileInfo"]("a", "b", ["c"], ["d"], em, "");
        });
    });

    describe("#prepareFileInfo", () => {
        let em: EventEmitter<TemplateFilesEmitterType>;

        beforeEach(() => {
            em = <EventEmitter<TemplateFilesEmitterType>>{
                emit: (ev, err) => {}
            };
        });

        it('should set needed properties', () => {
            let baseDir = "/my/base/", relPath = "one/more.txt", filePath = baseDir + "/" + relPath;
            let stats = <Stats>{
                isDirectory: () => true,
                size: 314
            };
            let spy = sinon.spy();
            tr["patterns"].match = spy;
            let result = tr["prepareFileInfo"](baseDir, filePath, ["c"], ["d"], em, stats);
            expect(result).to.be.not.null;
            expect(result.absolutePath).to.equal(filePath);
            expect(result.relativePath).to.equal(relPath);
            expect(result.isDirectory).to.be.true;
            expect(result.size).to.equal(stats.size);
            expect(spy.calledTwice).to.be.true;
            expect(result.includedBy).to.equal(spy.returnValues[0]);
            expect(result.excludedBy).to.equal(spy.returnValues[1]);
        });
    });

    describe("#handleFileInfo", () => {
        let em: EventEmitter<TemplateFilesEmitterType>;
        let baseDir = "/my/base/", relPath = "one/more.txt", filePath = baseDir + "/" + relPath;
        let include = ["a"], ignore = ["b"];

        beforeEach(() => {
            em = <EventEmitter<TemplateFilesEmitterType>>{
                emit: (ev, err) => {}
            };
        });

        it('should get descendents and emit tentative when not an excluded directory', () => {
            let gdspy = sinon.spy(), emitSpy = sinon.spy();
            tr["getDescendents"] = gdspy;
            em.emit = emitSpy;
            let f = <i.ITemplateFile>{
                isDirectory: true,
                includedBy: [],
                excludedBy: []
            };
            let rv = tr["handleFileInfo"](baseDir, filePath, include, ignore, em, f);
            expect(gdspy.calledOnce).to.be.true;
            sinon.assert.calledWith(gdspy, baseDir, filePath, em, include, ignore);
            expect(emitSpy.calledOnce).to.be.true;
            sinon.assert.calledWith(emitSpy, "tentative", f);
            expect(rv).to.equal(1);
        });

        it('should emit exclude when an excluded directory, even if include.', () => {
            let gdspy = sinon.spy(), emitSpy = sinon.spy();
            tr["getDescendents"] = gdspy;
            em.emit = emitSpy;
            let f = <i.ITemplateFile>{
                isDirectory: true,
                includedBy: ["doesn't matter; overridden by excludedBy"],
                excludedBy: ["some glob"]
            };
            let rv = tr["handleFileInfo"](baseDir, filePath, include, ignore, em, f);
            expect(gdspy.called).to.be.false;
            expect(emitSpy.calledOnce).to.be.true;
            sinon.assert.calledWith(emitSpy, "exclude", f);
            expect(rv).to.equal(0);
        });

        it('should emit match when included explicity and not excluded', () => {
            let gdspy = sinon.spy(), emitSpy = sinon.spy();
            tr["getDescendents"] = gdspy;
            em.emit = emitSpy;
            let f = <i.ITemplateFile>{
                isDirectory: false,
                includedBy: ["some glob"],
                excludedBy: []
            };
            let rv = tr["handleFileInfo"](baseDir, filePath, include, ignore, em, f);
            expect(gdspy.called).to.be.false;
            expect(emitSpy.calledOnce).to.be.true;
            sinon.assert.calledWith(emitSpy, "match", f);
            expect(rv).to.equal(1);
        });

        it('should emit match when included implicitly and not excluded', () => {
            let gdspy = sinon.spy(), emitSpy = sinon.spy();
            let include: string[] = []; // no includedBy + no explicit include + no excludedBy = should include.
            tr["getDescendents"] = gdspy;
            em.emit = emitSpy;
            let f = <i.ITemplateFile>{
                isDirectory: false,
                includedBy: [],
                excludedBy: []
            };
            let rv = tr["handleFileInfo"](baseDir, filePath, include, ignore, em, f);
            expect(gdspy.called).to.be.false;
            expect(emitSpy.calledOnce).to.be.true;
            sinon.assert.calledWith(emitSpy, "match", f);
            expect(rv).to.equal(1);
        });

        it('should emit exclude file when excluded explicitly', () => {
            let gdspy = sinon.spy(), emitSpy = sinon.spy();
            let include: string[] = []; // no includedBy + no explicit include + no excludedBy = should include.
            tr["getDescendents"] = gdspy;
            em.emit = emitSpy;
            let f = <i.ITemplateFile>{
                isDirectory: false,
                includedBy: [],
                excludedBy: ["something"]
            };
            let rv = tr["handleFileInfo"](baseDir, filePath, include, ignore, em, f);
            expect(gdspy.called).to.be.false;
            expect(emitSpy.calledOnce).to.be.true;
            sinon.assert.calledWith(emitSpy, "exclude", f);
            expect(rv).to.equal(0);
        });
    });
});
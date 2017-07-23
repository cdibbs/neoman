/// <reference path="../../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../../node_modules/@types/chai/index.d.ts" />
import { Stats } from 'fs';
import "reflect-metadata";
import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as sinon from 'sinon';
let expect = chai.expect, assert = chai.assert;

import { EventEmitter, TemplateFilesEmitterType } from './emitters';
import { TemplateRunner } from './template-runner';
import { RunOptions, RunnerResult } from './models';
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
        it('should pass input config to inputManager', () => {
            let callback = sinon.stub();
            callback.onCall(0).returns(Promise.resolve({}));
            let expected = <RunnerResult>{};
            tr["inputManager"]["ask"] = callback;
            tr["andRun"] = () => Promise.resolve(expected);
            tr["finishRun"] = () => expected;
            let opts = new RunOptions();
            let tmpl = <itmp.ITemplate>{
                __tmplPath: "",
                identity: "",
                name: "",
                input: { }
            };
            let result = tr["getUserInputAndRun"]("path", opts, tmpl);
            expect(callback.called).to.be.true;
            sinon.assert.calledWith(callback, sinon.match.same(tmpl.input));
            return expect(result).to.eventually.equal(expected);
        });
    });

    describe("#andRun", () => {
        let em: EventEmitter<TemplateFilesEmitterType>;
        beforeEach(() => {
            em = new EventEmitter<TemplateFilesEmitterType>();
        });

        it('should configure transformers, emitters and return promise.', () => {
            let tspy = sinon.spy();
            let ptspy = sinon.spy();
            let onspy = sinon.spy();
            em.on = onspy;
            let expected = <RunnerResult>{ totalFiles: 314 };
            tr["transformManager"]["configure"] = tspy;
            tr["pathTransformManager"]["configure"] = ptspy;
            tr["processDescendents"] = () => Promise.resolve(expected);
            let inputs = {}, tmpl = <itmp.ITemplate>{};
            let p = tr["andRun"]("", <RunOptions>{ verbosity: "debug" }, <itmp.ITemplate>{}, em, inputs);
            sinon.assert.calledWith(tspy, tmpl, sinon.match.same(inputs));
            sinon.assert.calledWith(ptspy, tmpl, sinon.match.same(inputs));
            sinon.assert.calledWith(onspy, "match", sinon.match.any);
            sinon.assert.calledWith(onspy, "tentative", sinon.match.any);
            sinon.assert.calledWith(onspy, "error", sinon.match.any);
            sinon.assert.calledWith(onspy, "exclude", sinon.match.any);
            return expect(p).to.eventually.equal(expected);
        });

        it('should curry emitter.on callbacks with correct params', () => {
            let tspy = sinon.spy();
            let ptspy = sinon.spy();
            let onspy = sinon.spy();
            let match = sinon.stub(), tentative = sinon.spy(), error = sinon.spy(), exclude = sinon.spy();
            let expected = <RunnerResult>{ totalFiles: 314 };
            //em.on = onspy;
            tr["transformManager"]["configure"] = tspy;
            tr["pathTransformManager"]["configure"] = ptspy;
            tr["processDescendents"] = () => Promise.resolve(expected);
            tr["matchTmplFile"] = match;
            tr["tentativeMatchTmplFile"] = tentative;
            tr["templateError"] = error;
            tr["excludeMatchTmplFile"] = exclude;
            let inputs = {}, tmpl = <itmp.ITemplate>{ pathTransform: "whoatest", transform: "testt" };            
            let p = tr["andRun"]("asdf", <RunOptions>{ verbosity: "debug" }, tmpl, em, inputs);
            em.emit("match", null);
            em.emit("tentative", null);
            em.emit("error", null);
            em.emit("exclude", null);
            sinon.assert.calledWith(match, "asdf", "whoatest", "testt", "debug", null);
            sinon.assert.calledWith(tentative, "asdf", "debug", null);
            sinon.assert.calledWith(error, null);
            sinon.assert.calledWith(exclude, null);
        });
    });

    describe('#finishRun', () => {
        it('should return count', () => {
            let expected = <RunnerResult>{totalFiles: 314};
            let r = tr["finishRun"](expected);
            expect(r).to.equal(expected);
        });
    });

    describe('#destinationEmpty', () => {
        it('should return true if readdir empty', () => {
            let spy = sinon.stub();
            spy.returns([]);
            tr["fs"]["readdirSync"] = spy;
            let result = tr["destinationEmpty"]("/path");
            expect(result).to.be.true;
        });
        it('should return false if readdir not empty', () => {
            let spy = sinon.stub();
            spy.returns([1,2,3]);
            tr["fs"]["readdirSync"] = spy;
            let result = tr["destinationEmpty"]("/path");
            expect(result).to.be.false;
        });
    });

    describe('#validate', () => {
        it('should return invalid if even one package missing', () => {
            let installed = {
                "a": true,
                "b": false,
                "c": true
            };
            tr["validator"]["dependenciesInstalled"] = () => installed;
            let valid = tr["validate"](<itmp.ITemplate>{});
            expect(valid).to.be.false;
        });
        it('should return valid if all packages present', () => {
            let installed = {
                "a": true,
                "b": true,
                "c": true
            };
            tr["validator"]["dependenciesInstalled"] = () => installed;
            let valid = tr["validate"](<itmp.ITemplate>{});
            expect(valid).to.be.true;
        });
    });

    describe('#handleDescendents', () => {
        it('should ', () => {
            // TODO finish this thought.
            tr["readdir"] = () => Promise.resolve(["one", "two", "three"]);
        });
    });
    
    describe('#run', () => {
        it('should ask user input when valid and dest dir empty.', () => {
            let expected = <RunnerResult>{totalFiles:314};
            tr['validate'] = () => true;
            tr['destinationEmpty'] = () => true;
            tr['getUserInputAndRun'] = () => Promise.resolve(expected);
            let result = tr.run("", new RunOptions(), <itmp.ITemplate>{});
            return result.should.eventually.equal(expected);
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

    describe("#processFileInfo", () => {
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
            tr["handleFileInfo"] = (...args: any[]) => Promise.resolve(<RunnerResult>{});
            tr["processFileInfo"](p, p, [], [], em, f)
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
            tr["processFileInfo"]("", "", [], [], em, "");
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
            tr["processFileInfo"]("a", "b", ["c"], ["d"], em, "");
        });
        it('should properly curry handleFileInfo', (done) => {
            let stats = <Stats>{};
            let expected = <RunnerResult>{};
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
                    return Promise.resolve(expected);
                }
            };
            tr["stat"] = () => Promise.resolve(stats);
            tr["processFileInfo"]("a", "b", ["c"], ["d"], em, "");
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
            let gdspy = sinon.stub(), emitSpy = sinon.spy();
            let expected = <RunnerResult>{};
            gdspy.returns(Promise.resolve(expected));
            tr["processDescendents"] = gdspy;
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
            return expect(rv).to.eventually.equal(expected);
        });

        it('should emit exclude when an excluded directory, even if includes match; excludes override includes', () => {
            let gdspy = sinon.stub(), emitSpy = sinon.spy();
            let expected = <RunnerResult>{ excluded: 1, processed: 1 };
            gdspy.throws("excluded! no recursion.");
            tr["processDescendents"] = gdspy;
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
            return expect(rv).eventually.to.deep.equal(expected);
        });

        it('should emit match when included explicity and not excluded', () => {
            let gdspy = sinon.stub(), emitSpy = sinon.spy();
            let expected = <RunnerResult>{ totalFiles: 1, processed: 1 };
            gdspy.throws("not a directory! no recursion.");
            tr["processDescendents"] = gdspy;
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
            return expect(rv).eventually.to.deep.equal(expected);
        });

        it('should emit match when included implicitly and not excluded', () => {
            let gdspy = sinon.stub(), emitSpy = sinon.spy();
            let expected = <RunnerResult>{ processed: 1, totalFiles: 1 };
            gdspy.returns(Promise.resolve(expected));
            let include: string[] = []; // no includedBy + no explicit include + no excludedBy = should include.
            tr["processDescendents"] = gdspy;
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
            return expect(rv).eventually.to.deep.equal(expected);
        });

        it('should emit exclude file when excluded explicitly', () => {
            let gdspy = sinon.stub(), emitSpy = sinon.spy();
            let expected = <RunnerResult>{ excluded: 1, processed: 1 };
            gdspy.returns(Promise.resolve(expected));
            let include: string[] = []; // any excludedBy ever = should exclude.
            tr["processDescendents"] = gdspy;
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
            return expect(rv).eventually.to.deep.equal(expected);
        });
    });
});
/// <reference path="../../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../../node_modules/@types/chai/index.d.ts" />
import { Stats } from 'fs';
import "reflect-metadata";
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
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
        it('should properly curry handleFileInfo', (done) => {
            let stats = <Stats>{};
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
                    return 0;
                }
            };
            tr["stat"] = () => Promise.resolve(stats);
            tr["getFileInfo"]("a", "b", ["c"], ["d"], em, "");
        });
    });
});
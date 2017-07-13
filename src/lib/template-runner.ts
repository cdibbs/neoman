import { injectable, inject } from 'inversify';
import * as fse from 'fs-extra';

import { EventEmitter, TemplateFilesEmitterType } from './emitters';
import { COMMANDS, Commands } from './commands';
import { VERBOSITY, Verbosity } from './types/verbosity';
import { RunOptions } from './models';
import TYPES from './di/types';
import KEYS from './settings-keys';
import * as i from './i';
import * as iemitters from './emitters/i';
import { ITemplate, Transforms, PathTransforms } from './i/template';
import * as it from './transformers/i';

@injectable()
export class TemplateRunner implements i.ITemplateRunner {

    constructor(
        @inject(TYPES.UserMessager) protected msg: i.IUserMessager,
        @inject(TYPES.FS) private fs: i.IFileSystem,
        @inject(TYPES.Path) private path: i.IPath,
        @inject(TYPES.FilePatterns) private patterns: i.IFilePatterns,
        @inject(TYPES.InputManager) private inputManager: i.IInputManager,
        @inject(TYPES.TransformManager) private transformManager: it.ITransformManager,
        @inject(TYPES.PathTransformManager) private pathTransformManager: it.IPathTransformManager,
        @inject(TYPES.TemplateValidator) private validator: i.ITemplateValidator
    ) {
    }

    run(path: string, options: RunOptions, tmpl: ITemplate): Promise<number> {
        let results: string[] = [];
        if (!this.validate(tmpl)) {
            return Promise.reject("Template configuration not valid.");
        }

        if (!this.destinationEmpty(path) /* && not force */) {
            return Promise.reject(`The destination directory is not empty (${path}).`);
        }

        return this.getUserInputAndRun(path, options, tmpl);
    }

    protected getUserInputAndRun(path: string, options: RunOptions, tmpl: ITemplate): Promise<number> {
        let emitter = new EventEmitter<TemplateFilesEmitterType>();
        return this.inputManager
            .ask(tmpl.inputConfig)
            .then(this.andRun.bind(this, path, options, tmpl, emitter))
            .then<number>(this.finishRun.bind(this));
    }

    protected andRun(
        path: string,
        options: RunOptions,
        tmpl: ITemplate,
        emitter: EventEmitter<TemplateFilesEmitterType>,
        inputs: { [key: string]: any }): Promise<number>
    {
        this.msg.write(`Copying and transforming files into ${path}...`);
        this.transformManager.configure(tmpl, inputs);
        this.pathTransformManager.configure(tmpl, inputs);
        emitter.on('match', this.matchTmplFile.bind(this, path, tmpl.pathTransform, tmpl.transform, options.verbosity));
        emitter.on('tentative', this.tentativeMatchTmplFile.bind(this, path, options.verbosity));
        emitter.on('error', this.templateError.bind(this))
        if (options.verbosity === VERBOSITY.debug || options.showExcluded) {
            emitter.on('exclude', this.tentativeMatchTmplFile.bind(this));
        }

        return this.getDescendents(tmpl.__tmplPath, tmpl.__tmplPath, emitter, tmpl.files, tmpl.ignore);
    }

    protected finishRun(count: number): number {
        this.msg.info(`${count} files processed.`);
        return count;
    }

    protected destinationEmpty(path: string): boolean {
        return this.fs.readdirSync(path).length === 0;
    }

    protected validate(tmpl: ITemplate): boolean {
        let deps = this.validator.dependenciesInstalled(tmpl);
        let missing: boolean = false;
        for(var key in deps) {
            let depInstalled = deps[key];
            if (!depInstalled) {
                this.msg.write(`Template '${tmpl.name}' requires npm package '${key}', which is not installed.`);
                missing = true;
            }
        }

        return !missing;
    }

    protected matchTmplFile(path: string, pathTransforms: PathTransforms, transforms: Transforms, verbosity: Verbosity, tmplFile: i.ITemplateFile): void {
        if (verbosity === VERBOSITY.debug)
            this.msg.debug(`Include: ${tmplFile.absolutePath}`);

        this.msg.info(`Processing ${tmplFile.absolutePath}...`);
        this.msg.debug(`Applying path transforms...`, 1);
        let destRelPath = this.pathTransformManager.applyTransforms(tmplFile.relativePath, pathTransforms);
        let destFile = this.path.join(path, destRelPath);
        let destPath = this.path.dirname(destFile);
        let content = fse.readFileSync(tmplFile.absolutePath).toString("utf8");
        this.msg.debug(`Applying transforms...`, 1);
        content = this.transformManager.applyTransforms(tmplFile.relativePath, content, transforms);
        this.msg.debug(`Writing to destination: ${destFile}`, 1);
        fse.ensureDirSync(destPath);
        fse.writeFileSync(destFile, content);
        this.msg.debug('Done.');
    }

    // directories not explicitly matched or excluded.
    protected tentativeMatchTmplFile(path: string, verbosity: Verbosity, tmplFile: i.ITemplateFile): void {
        if (verbosity === VERBOSITY.debug)
            this.msg.debug(`Tentative: ${tmplFile.relativePath}`);
    }

    protected excludeMatchTmplFile(tmplFile: i.ITemplateFile): void {
        this.msg.debug(`Exclude: ${tmplFile}`);
    }

    protected templateError(err: Error): void {
        this.msg.error(err.stack);
    }

    protected getDescendents(baseDir: string, dir: string, emitter: iemitters.IEventEmitter<TemplateFilesEmitterType>, include: string[] = [], ignore: string[] = []): Promise<number> {
        try {
            return fse.readdir(dir)
                .then(files => {
                    return Promise.all(files.map(this.getFileInfo.bind(this, baseDir, dir, include, ignore, emitter)));
                })
                .then((files) => files.length)
                .catch(err => { emitter.emit('error', err); return 0; });
        } catch (err) {
            return Promise.reject(err);
        }
    }

    protected getFileInfo(
        baseDir: string,
        sourceDir: string,
        include: string[],
        ignore: string[],
        emitter: iemitters.IEventEmitter<TemplateFilesEmitterType>,
        file: string): Promise<number>
    {
        let p = this.path.join(sourceDir, file);
        return <Promise<number>>this.stat(p)
            .then<number>(this.handleFileInfo.bind(this, baseDir, p, include, ignore, emitter))
            .catch(err => emitter.emit('error', err));
    }

    protected handleFileInfo(
        baseDir: string,
        sourceFilePath: string,
        include: string[],
        ignore: string[],
        emitter: iemitters.IEventEmitter<TemplateFilesEmitterType>,
        stat: fse.Stats): number
    {
        let f = <i.ITemplateFile>{
            absolutePath: sourceFilePath,
            relativePath: sourceFilePath.substr(baseDir.length + 1),
            size: stat.size
        };
        f.includedBy = this.patterns.match(f.relativePath, include);
        f.excludedBy = this.patterns.match(f.relativePath, ignore);
        if (stat.isDirectory()) {
            if (f.excludedBy.length === 0) {
                f.isDirectory = true;
                emitter.emit('tentative', f);
                this.getDescendents(baseDir, sourceFilePath, emitter, include, ignore);
                return 1;
            } else {
                emitter.emit('exclude', f);
                return 0;
            }
        } else if (f.excludedBy.length === 0 && f.includedBy.length > 0) {
            f.isDirectory = false;
            emitter.emit('match', f);
            return 1;
        } else {
            f.isDirectory = false;
            emitter.emit('exclude', f);
            return 0;
        }
    }

    protected stat(p: string): Promise<fse.Stats> {
        return fse.stat(p);
    }
}
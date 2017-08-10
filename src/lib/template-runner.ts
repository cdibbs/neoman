import { injectable, inject } from 'inversify';
import * as fse from 'fs-extra';

import { EventEmitter, TemplateFilesEmitterType } from './emitters';
import { COMMANDS, Commands } from './commands';
import { VERBOSITY, Verbosity } from './types/verbosity';
import { RunOptions, RunnerResult } from './models';
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

    run(path: string, options: RunOptions, tmpl: ITemplate): Promise<RunnerResult> {
        let results: string[] = [];
        if (!this.validate(tmpl)) {
            return Promise.reject("Template configuration not valid.");
        }

        if (!this.destinationEmpty(path) /* && not force */) {
            return Promise.reject(this.msg.i18n({path}).mf('The destination directory is not empty ({path}).',));
        }

        return this.getUserInputAndRun(path, options, tmpl);
    }

    protected getUserInputAndRun(path: string, options: RunOptions, tmpl: ITemplate): Promise<RunnerResult> {
        let emitter = new EventEmitter<TemplateFilesEmitterType>();
        return this.inputManager
            .ask(tmpl.input)
            .then(this.andRun.bind(this, path, options, tmpl, emitter))
            .then<RunnerResult>(this.finishRun.bind(this));
    }

    protected andRun(
        path: string,
        options: RunOptions,
        tmpl: ITemplate,
        emitter: EventEmitter<TemplateFilesEmitterType>,
        inputs: { [key: string]: any }): Promise<RunnerResult>
    {
        this.msg.i18n({path: path}).write('Copying and transforming files into {path}...');
        this.transformManager.configure(tmpl, inputs);
        this.pathTransformManager.configure(tmpl, inputs);
        emitter.on('match', this.matchTmplFile.bind(this, path, tmpl.pathTransform, tmpl.transform, options.verbosity));
        emitter.on('tentative', this.tentativeMatchTmplFile.bind(this, path, options.verbosity));
        emitter.on('error', this.templateError.bind(this))
        if (options.verbosity === VERBOSITY.debug || options.showExcluded) {
            emitter.on('exclude', this.excludeMatchTmplFile.bind(this));
        }

        return this.processDescendents(tmpl.__tmplPath, tmpl.__tmplPath, emitter, tmpl.files, tmpl.ignore);
    }

    protected finishRun(result: RunnerResult): RunnerResult {
        this.msg.i18n(result)
            .info('{processed} file(s) considered.')
            .info('{excluded} file(s) excluded.')
            .info('{totalFiles} file(s) copied.');
        return result;
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
                this.msg
                    .i18n({ name: tmpl.name, key })
                    .write("Template '{name}' requires npm package '{key}', which is not installed.");
                missing = true;
            }
        }

        return !missing;
    }

    protected matchTmplFile(path: string, pathTransforms: PathTransforms, transforms: Transforms, verbosity: Verbosity, tmplFile: i.ITemplateFile): void {
        if (verbosity === VERBOSITY.debug)
            this.msg.i18n({absPath: tmplFile.absolutePath}).debug("Include: {absPath}");

        this.msg.i18n({absPath: tmplFile.absolutePath})
            .info('Processing {absPath}...')
            .debug(`Applying path transforms...`, 1);
        let destRelPath = this.pathTransformManager.applyTransforms(tmplFile.relativePath, pathTransforms);
        let destFile = this.path.join(path, destRelPath);
        let destPath = this.path.dirname(destFile);
        let content = this.readFileSync(tmplFile.absolutePath).toString("utf8");
        this.msg.i18n().debug(`Applying transforms...`, 1);
        content = this.transformManager.applyTransforms(tmplFile.relativePath, content, transforms);
        this.msg.i18n({destFile}).debug('Writing to destination: {destFile}', 1);
        this.ensureDirSync(destPath);
        this.writeFileSync(destFile, content);
        this.msg.i18n().debug('Done.');
    }

    // Testability FTW!
    protected readdir = fse.readdir;
    protected ensureDirSync = fse.ensureDirSync;
    protected stat = fse.stat;
    protected readFileSync(path: string): Buffer { return fse.readFileSync(path); }
    protected writeFileSync(dest: string, content: any): void { return fse.writeFileSync(dest, content); }


    // directories not explicitly matched or excluded.
    protected tentativeMatchTmplFile(path: string, verbosity: Verbosity, tmplFile: i.ITemplateFile): void {
        if (verbosity === VERBOSITY.debug)
            this.msg.i18n({relPath: tmplFile.relativePath})
                .debug('Tentative: {relPath}');
    }

    protected excludeMatchTmplFile(tmplFile: i.ITemplateFile): void {
        this.msg.i18n({relPath: tmplFile.relativePath})
            .debug('Exclude: {relPath}');
    }

    protected templateError(err: Error): void {
        this.msg.error(err.stack);
    }

    protected processDescendents(
        baseDir: string,
        dir: string,
        emitter: iemitters.IEventEmitter<TemplateFilesEmitterType>,
        include: string[] = [],
        ignore: string[] = []): Promise<RunnerResult>
    {
        return this.readdir(dir)
            .then<RunnerResult[]>(files => Promise.all(files.map(this.processFileInfo.bind(this, baseDir, dir, include, ignore, emitter))))
            .then((results: RunnerResult[]) => results.reduce<RunnerResult>((p, c) => this.combineResults(p, c), new RunnerResult()))
            .catch(err => { emitter.emit('error', err); return new RunnerResult(); });
    }

    protected combineResults(a: RunnerResult, b: RunnerResult): RunnerResult {
        let c = new RunnerResult();
        c.totalFiles = (a.totalFiles || 0) + (b.totalFiles || 0);
        c.changed = (a.changed || 0) + (b.changed || 0);
        c.excluded = (a.excluded || 0) + (b.excluded || 0);
        c.processed = (a.processed || 0) + (b.processed || 0);
        c.totalChanges = (a.totalChanges || 0) + (b.totalChanges || 0);
        return c;
    }

    protected processFileInfo(
        baseDir: string,
        sourceDir: string,
        include: string[],
        ignore: string[],
        emitter: iemitters.IEventEmitter<TemplateFilesEmitterType>,
        file: string): Promise<RunnerResult>
    {
        let p = this.path.join(sourceDir, file);
        return <Promise<RunnerResult>>this.stat(p)
            .then(this.prepareFileInfo.bind(this, baseDir, p, include, ignore, emitter))
            .then<RunnerResult>(this.handleFileInfo.bind(this, baseDir, p, include, ignore, emitter))
            .catch(err => emitter.emit('error', err));
    }

    protected prepareFileInfo(
        baseDir: string,
        sourceFilePath: string,
        include: string[],
        ignore: string[],
        emitter: iemitters.IEventEmitter<TemplateFilesEmitterType>,
        stat: fse.Stats): i.ITemplateFile
    {
        let relPath: string = sourceFilePath.substr(baseDir.length + 1);
        return <i.ITemplateFile>{
            absolutePath: sourceFilePath,
            relativePath: relPath,
            size: stat.size,
            isDirectory: stat.isDirectory(),
            includedBy: this.patterns.match(relPath, include),
            excludedBy: this.patterns.match(relPath, ignore)
        };
    }

    protected handleFileInfo(
        baseDir: string,
        sourceFilePath: string,
        include: string[],
        ignore: string[],
        emitter: iemitters.IEventEmitter<TemplateFilesEmitterType>,
        f: i.ITemplateFile): Promise<RunnerResult>
    {
        if (f.isDirectory) {
            if (f.excludedBy.length === 0) {
                emitter.emit('tentative', f);
                return this.processDescendents(baseDir, sourceFilePath, emitter, include, ignore);
                
            } else {
                emitter.emit('exclude', f);
                return Promise.resolve(<RunnerResult>{ excluded: 1, processed: 1 });
            }
        } else if (f.excludedBy.length === 0 && (f.includedBy.length > 0 || include.length === 0)) {
            emitter.emit('match', f);
            return Promise.resolve(<RunnerResult>{ totalFiles: 1, processed: 1 });
        } else {
            emitter.emit('exclude', f);
            return Promise.resolve(<RunnerResult>{ excluded: 1, processed: 1 });
        }
    }
}
import { injectable, inject } from 'inversify';
import * as fse from 'fs-extra';

import { EventEmitter, TemplateFilesEmitterType } from './emitters';
import { COMMANDS, Commands, VERBOSITY, Verbosity } from './commands';
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
        @inject(TYPES.TemplateValidator) private validator: i.ITemplateValidator,
        @inject(TYPES.Process) private process: NodeJS.Process
    ) {
    }

    run(path: string, verbosity: Verbosity, showExcluded: boolean, tmpl: ITemplate): Promise<number> {
        let results: string[] = [];
        let emitter = new EventEmitter<TemplateFilesEmitterType>();
        if (!this.validate(tmpl)) {
            return;
        }

        if (!this.destinationEmpty(path) /* && not force */) {
            this.msg.error(`The destination directory is not empty (${path}). Aborting.`);
            return;
        }

        return this.inputManager.ask(tmpl.inputConfig).then(inputs => {
            this.msg.write(`Copying and transforming files into ${path}...`);
            this.transformManager.configure(tmpl, inputs);
            emitter.on('match', this.matchTmplFile.bind(this, path, tmpl.pathTransform, tmpl.transform, verbosity));
            emitter.on('tentative', this.tentativeMatchTmplFile.bind(this, path, verbosity));
            emitter.on('error', this.templateError.bind(this))
            if (verbosity === VERBOSITY.debug || showExcluded) {
                emitter.on('exclude', this.tentativeMatchTmplFile.bind(this));
            }

            return this.getDescendents(tmpl.__tmplPath, tmpl.__tmplPath, emitter, tmpl.files, tmpl.ignore)
                .then((count: number) => {
                    this.msg.info(`${count} files processed.`);
                    return count;
                });
        });
    }

    destinationEmpty(path: string): boolean {
        return this.fs.readdirSync(path).length === 0;
    }

    validate(tmpl: ITemplate): boolean {
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

    matchTmplFile(path: string, pathTransforms: PathTransforms, transforms: Transforms, verbosity: Verbosity, tmplFile: i.ITemplateFile): void {
        if (verbosity === VERBOSITY.debug)
            this.msg.debug(`Include: ${tmplFile.absolutePath}`);

        let destRelPath = this.pathTransformManager.applyTransforms(tmplFile.relativePath, pathTransforms);
        let destFile = this.path.join(path, destRelPath);
        let destPath = this.path.dirname(destFile);
        this.msg.info(`Processing ${tmplFile.absolutePath}...`);
        let content = fse.readFileSync(tmplFile.absolutePath).toString("utf8");
        this.msg.debug(`Applying transforms...`, 1);
        content = this.transformManager.applyTransforms(tmplFile.relativePath, content, transforms);
        //content = this.replaceAllInFile(tmplFile.relativePath, content, replaceDef);
        this.msg.debug(`Writing to destination: ${destFile}`, 1);
        fse.ensureDirSync(destPath);
        fse.writeFileSync(destFile, content);
        this.msg.debug('Done.');
    }

    // directories not explicitly matched or excluded.
    tentativeMatchTmplFile(path: string, verbosity: Verbosity, tmplFile: i.ITemplateFile): void {
        if (verbosity === VERBOSITY.debug)
            this.msg.debug(`Tentative: ${tmplFile.relativePath}`);
    }

    excludeMatchTmplFile(tmplFile: i.ITemplateFile): void {
        this.msg.debug(`Exclude: ${tmplFile}`);
    }

    templateError(err: Error): void {
        this.msg.error(err.stack);
    }

    getDescendents(baseDir: string, dir: string, emitter: iemitters.IEventEmitter<TemplateFilesEmitterType>, include: string[] = [], ignore: string[] = []): Promise<number> {
        try {
            let r = fse.readdir(dir)
                .then(files => {
                    return Promise.all(files.map(this.getFileInfo.bind(this, baseDir, dir, include, ignore, emitter)));
                })
                .then((files) => files.length)
                .catch(err => { emitter.emit('error', err); return 0; });
        } catch (err) {
            return new Promise<number>((_, reject) => reject(err));
        }
    }

    getFileInfo(
        baseDir: string,
        dir: string,
        include: string[],
        ignore: string[],
        emitter: iemitters.IEventEmitter<TemplateFilesEmitterType>,
        file: string): Promise<any>
    {
        let p = this.path.join(dir, file);
        return fse.stat(p).then((stat: fse.Stats) => {
            let f = <i.ITemplateFile>{
                absolutePath: p,
                relativePath: p.substr(baseDir.length + 1),
                size: stat.size
            };
            f.includedBy = this.patterns.match(f.relativePath, include);
            f.excludedBy = this.patterns.match(f.relativePath, ignore);
            if (stat.isDirectory()) {
                if (f.excludedBy.length === 0) {
                    f.isDirectory = true;
                    emitter.emit('tentative', f);
                    this.getDescendents(baseDir, p, emitter, include, ignore);
                } else {
                    emitter.emit('exclude', f);
                }
            } else if (f.excludedBy.length === 0 && f.includedBy.length > 0) {
                f.isDirectory = false;
                emitter.emit('match', f);
            }
        }).then(() => 1).catch(err => emitter.emit('error', err));
    }
}
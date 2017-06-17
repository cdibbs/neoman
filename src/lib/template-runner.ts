import { injectable, inject } from 'inversify';
import * as fse from 'fs-extra';

import { EventEmitter, TemplateFilesEmitterType } from './emitters';
import { COMMANDS, Commands, VERBOSITY, Verbosity } from './commands';
import TYPES from './di/types';
import KEYS from './settings-keys';
import * as i from './i';
import * as iemitters from './emitters/i';
import { ITemplate, IReplacementDefinition } from './i/template';
import * as it from './transformers/i';

@injectable()
export class TemplateRunner implements i.ITemplateRunner {
    private tmplDir: string;

    constructor(
        @inject(TYPES.SettingsProvider) protected settings: i.ISettingsProvider,
        @inject(TYPES.UserMessager) protected msg: i.IUserMessager,
        @inject(TYPES.FS) private fs: i.IFileSystem,
        @inject(TYPES.Path) private path: i.IPath,
        @inject(TYPES.Glob) private glob: i.IGlob,
        @inject(TYPES.FilePatterns) private patterns: i.IFilePatterns,
        @inject(TYPES.TransformManager) private transformManager: it.ITransformManager
    ) {
        this.tmplDir = this.settings.get(KEYS.tempDirKey);
    }

    run(tmpl: ITemplate, path: string, verbosity: Verbosity, showExcluded: boolean): void {
        let results: string[] = [];
        let emitter = new EventEmitter<TemplateFilesEmitterType>();
        emitter.on('match', this.matchTmplFile.bind(this, path, tmpl.replace, verbosity));
        emitter.on('tentative', this.tentativeMatchTmplFile.bind(this, path, verbosity));
        emitter.on('error', this.templateError.bind(this))
        if (verbosity === VERBOSITY.debug || showExcluded) {
            emitter.on('exclude', this.tentativeMatchTmplFile.bind(this));
        }

        this.getDescendents.bind(this)(tmpl.__tmplPath, tmpl.__tmplPath, emitter, tmpl.files, tmpl.ignore);
    }

    matchTmplFile(path: string, replaceDef: IReplacementDefinition, verbosity: Verbosity, tmplFile: i.ITemplateFile): void {
        if (verbosity === VERBOSITY.debug)
            this.msg.log("include", tmplFile.absolutePath);

        let destFile = this.path.join(path, tmplFile.relativePath);
        let destPath = this.path.dirname(destFile);
        this.msg.log(`Copying from ${tmplFile.absolutePath} to ${destFile}...`);
        let content = fse.readFileSync(tmplFile.absolutePath).toString("utf8");
        content = this.transformManager.applyTransforms(content, replaceDef);
        //content = this.replaceAllInFile(tmplFile.relativePath, content, replaceDef);
        fse.ensureDirSync(destPath);
        fse.writeFileSync(destFile, content);
    }

    // directories not explicitly matched or excluded.
    tentativeMatchTmplFile(path: string, verbosity: Verbosity, tmplFile: i.ITemplateFile): void {
        if (verbosity === VERBOSITY.debug)
            this.msg.log("tentative", tmplFile.relativePath);
    }

    excludeMatchTmplFile(tmplFile: i.ITemplateFile): void {
        this.msg.log("Excluding", tmplFile);
    }

    templateError(err: Error): void {
        this.msg.error(err);
    }

    getDescendents(baseDir: string, dir: string, emitter: iemitters.IEventEmitter<TemplateFilesEmitterType>, include: string[], ignore: string[]): void {
        try {
            fse.readdir(dir).then(files => {
                files.map(file => {
                    let p = this.path.join(dir, file);
                    fse.stat(p).then((stat: fse.Stats) => {
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
                    });
                });
            });
        } catch (err) {
            emitter.emit('error', err);
        }
    }
}
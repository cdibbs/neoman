import { injectable, inject } from 'inversify';
import * as fse from 'fs-extra';
import * as minimatch from 'minimatch';

import { Commands, COMMANDS } from './commands';
import { Verbosity, VERBOSITY } from './verbosity';
import { BaseCommand } from './base-command';
import { IPath, IUserMessager, ITemplateManager, IGlob, ITemplate, IFileSystem, ITemplateFile } from '../i';
import { IEventEmitter } from '../emitters/i';
import { TemplateFilesEmitterType, EventEmitter } from '../emitters';
import { INewCmdArgs, INewCmdOpts } from './i';
import TYPES from '../di/types';

@injectable()
export class NewCommand extends BaseCommand<INewCmdOpts, INewCmdArgs> {
    type: Commands = COMMANDS.NewProject;

    constructor(
        @inject(TYPES.UserMessager) protected msg: IUserMessager,
        @inject(TYPES.Glob) protected Glob: IGlob,
        @inject(TYPES.TemplateManager) protected tmplMgr: ITemplateManager,
        @inject(TYPES.Process) protected process: NodeJS.Process,
        @inject(TYPES.Path) private path: IPath,
        @inject(TYPES.FS) private fs: IFileSystem
    ) {
        super(msg, process);
    }

    run(opts: INewCmdOpts, args: INewCmdArgs): void {
        super.run(opts, args);

        let cwd = this.process.cwd(), cdname = cwd.split(this.path.sep).pop();
        let optsName = opts.name.join(' ').trim();
        let name = optsName || cdname;
        let path = opts.path || cwd;        
        this.msg.log(`Generating project ${name} from template ${args.template}...`);
        this.msg.log(`Copying into ${path}`);
        this.tmplMgr.info(args.template).then((tmpl: ITemplate) => this.runTemplate.bind(this)(tmpl, path, opts));
    }

    runTemplate(tmpl: ITemplate, path: string, opts: INewCmdOpts): void {
        let results: string[] = [];
        let emitter = new EventEmitter<TemplateFilesEmitterType>();
        emitter.on('match', (tmplFile: ITemplateFile) => {
            if (opts.verbosity[0] === VERBOSITY.debug)
                console.log("include", tmplFile.absolutePath);
            
            let destPath = this.path.join(path, tmplFile.relativePath);
            this.msg.log(`Copying from ${tmplFile.absolutePath} to ${destPath}...`);
            let content = fse.readFileSync(tmplFile.absolutePath);
            fse.ensureDirSync(this.path.dirname(destPath));
            fse.writeFileSync(destPath, content);
            //fse.copySync(tmplFile.absolutePath, path);
        });

        // directories not explicitly matched or excluded.
        emitter.on('tentative', (path) => {
            if (opts.verbosity[0] === VERBOSITY.debug)
                console.log("tentative", path);
        });

        if (opts.verbosity[0] === VERBOSITY.debug || opts.showExcluded) {
            emitter.on('exclude', (tmplFile: ITemplateFile) => {
                console.log("Excluding", tmplFile);
            });
        }

        emitter.on('error', (err) => {
            console.error(err);
        })
        this.getDescendents.bind(this)(tmpl.__tmplPath, tmpl.__tmplPath, emitter, tmpl.files, tmpl.ignore);
    }

    getDescendents(baseDir: string, dir: string, emitter: IEventEmitter<TemplateFilesEmitterType>, include: string[], ignore: string[]): void {
        fse.readdir(dir).then(files => {
            files.map(file => {
                let p = this.path.join(dir, file);
                fse.stat(p).then((stat: fse.Stats) => {
                    let f = <ITemplateFile>{
                        absolutePath: p,
                        relativePath: p.substr(baseDir.length + 1),
                        size: stat.size
                    };
                    f.includedBy = this.match(f.relativePath, include);
                    f.excludedBy = this.match(f.relativePath, ignore);
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
    }

    match(path: string, patterns: string[]): string[] {
        return patterns.reduce((p, cpattern) => {
            if (minimatch(path, cpattern)) {
                p.push(cpattern);
            }
            return p;
        }, []);
    }
}
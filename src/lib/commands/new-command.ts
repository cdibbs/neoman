import { injectable, inject } from 'inversify';
import * as fse from 'fs-extra';
import * as minimatch from 'minimatch';

import { Commands, COMMANDS } from './commands';
import { Verbosity, VERBOSITY } from './verbosity';
import { BaseCommand } from './base-command';
import { IPath, IUserMessager, ITemplateManager, IGlob, IFileSystem, ITemplateFile } from '../i';
import { ITemplate, ReplacementsDefinition, IReplacementDefinition } from '../i/template';
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
        let path = opts.path[0] || cwd;        
        this.msg.log(`Generating project ${name} from template ${args.template}...`);
        this.msg.log(`Copying into ${path}`);
        this.tmplMgr.info(args.template).then((tmpl: ITemplate) => this.runTemplate.bind(this)(tmpl, path, opts));
    }

    runTemplate(tmpl: ITemplate, path: string, opts: INewCmdOpts): void {
        let results: string[] = [];
        let emitter = new EventEmitter<TemplateFilesEmitterType>();
        emitter.on('match', (tmplFile: ITemplateFile) => {
            if (opts.verbosity[0] === VERBOSITY.debug)
                this.msg.log("include", tmplFile.absolutePath);
            
            let destFile = this.path.join(path, tmplFile.relativePath);
            let destPath = this.path.dirname(destFile);
            this.msg.log(`Copying from ${tmplFile.absolutePath} to ${destFile}...`);
            let content = fse.readFileSync(tmplFile.absolutePath).toString("utf8");
            content = this.replaceAllInFile(tmplFile.relativePath, content, tmpl.replace);
            fse.ensureDirSync(destPath);
            fse.writeFileSync(destFile, content);
        });

        // directories not explicitly matched or excluded.
        emitter.on('tentative', (path) => {
            if (opts.verbosity[0] === VERBOSITY.debug)
                this.msg.log("tentative", path);
        });

        if (opts.verbosity[0] === VERBOSITY.debug || opts.showExcluded) {
            emitter.on('exclude', (tmplFile: ITemplateFile) => {
                this.msg.log("Excluding", tmplFile);
            });
        }

        emitter.on('error', (err) => {
            console.error(err);
        })
        this.getDescendents.bind(this)(tmpl.__tmplPath, tmpl.__tmplPath, emitter, tmpl.files, tmpl.ignore);
    }

    replaceAllInFile(path: string, content: string, rdef: ReplacementsDefinition): string {
        if (rdef instanceof Array) {
            return this.replaceInFile(path, content, <IReplacementDefinition[]>rdef);
        } else if (typeof rdef === "string") { // simple regexp?
            return content;
        } else if (typeof rdef === "object") { // single replacement? probably a namespace or similar.
            return content;
        }

        throw new Error(`Replace definition not understood. Type found: ${typeof rdef}.`);
    }

    replaceInFile(path: string, content: string, rdefs: IReplacementDefinition[] | string[]): string {
        let count = 0;
        for (let i=0; i<rdefs.length; i++) {
            let rdef = rdefs[i];
            if (typeof rdef === "string") {
                // Assume its a comment, for now. Later, we might look to see if its a regexp.
            } else if (typeof rdef === "object") {
                if (this.replaceDoesApply(path, rdef.files, rdef.ignore, rdef.configuration)) {
                    count ++;
                    //this.msg.debug(`Applying replace definition for ${rdef.replace}...`);
                    content = this.applyReplace(content, rdef);
                }
            } else {
                throw new Error(`Unrecognized replacement definition ${i}, type: ${typeof rdef}.`);
            }
        }
        //this.msg.debug(`${count} replacements.`);

        return content;
    }

    applyReplace(content: string, rdef: IReplacementDefinition):  string {
        if (rdef.regex) {
            console.log("here...");
            return content.replace(new RegExp(<string>rdef.replace), this.buildReplacer(rdef));
        } else {
            if (rdef.with !== "string")
                return content; //throw new Error("Replace regular string with action call result not implemented, yet. Sorry.");

            console.log("here2");
            return content.split(<string>rdef.replace).join(rdef.with);
        }
    }

    buildReplacer(rdef: IReplacementDefinition): (substr: string) => string {
        if (typeof rdef.with === "string") {
             return (substr: string) => { console.log("1"); return <string>rdef.with };
        } else if (typeof rdef.with === "object" && rdef.with.action) {
            //TODO FIXME not truly implemented
            return (substr: string) => { console.log("2"); return substr; };
        }

        throw new Error(`Not yet implemented for 'with' is '${typeof rdef.with}'.`);
    }

    replaceDoesApply(path: string, files: string[], ignore: string[], configuration: string): boolean {
        if (typeof files === "undefined" && typeof ignore === "undefined")
            return true; // No explicit inclusions or exclusions. Global replace.

        let filesMatch = (files && (files instanceof Array) && files.length) ? this.match(path, files) : [];
        let ignoresMatch = (ignore && (ignore instanceof Array) && ignore.length) ? this.match(path, ignore) : [];

        // TODO FIXME configuration
        if (configuration) return false;

        if (typeof files === "undefined" && (typeof ignore !== "undefined" && ! ignoresMatch.length))
            return true; // Files undefined, but no ignore matches. Global replace.

        return (filesMatch.length && !ignoresMatch.length);
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
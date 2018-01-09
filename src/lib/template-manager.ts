import { injectable, inject } from 'inversify';

import { EventEmitter, TemplateSearchEmitterType } from './emitters';
import { COMMANDS, Commands } from './commands';
import { curry } from './util/curry';
import TYPES from './di/types';
import KEYS from './settings-keys';
import { IFileSystem, IGlob, IPath, IUserMessager, ITemplateManager, ISettingsProvider } from './i';
import { ITemplate } from './i/template';

@injectable()
export class TemplateManager implements ITemplateManager {
    private tmplDir: string;

    constructor(
        @inject(TYPES.SettingsProvider) protected settings: ISettingsProvider,
        @inject(TYPES.UserMessager) protected msg: IUserMessager,
        @inject(TYPES.FS) private fs: IFileSystem,
        @inject(TYPES.Path) private path: IPath,
        @inject(TYPES.Glob) private glob: IGlob
    ) {
        this.tmplDir = this.settings.get(KEYS.tempDirKey);
    }


    // Essentially, this maps a glob-match emitter to an ITemplate emitter
    list(): EventEmitter<TemplateSearchEmitterType> {
        let templates: ITemplate[] = [];
        let emitter = new EventEmitter<TemplateSearchEmitterType>();
        // on glob match, the following adds an ITemplate to templates for later return at "end" event:
        emitter.on("match", curry.oneOf2(this.listMatch, this, templates));

        let search = new this.glob.Glob("*/.neoman.config/template.json", { cwd: this.tmplDir });
        search.on("match", curry.oneOf2(this.templateMatch, this, emitter))
        search.on("end", curry.twoOf3(this.endList, this, templates, emitter));

        return emitter;
    }

    info(tmplId: string): Promise<ITemplate> {
        return new Promise((resolve, reject) => {
            let emitter = this.list();
            emitter.on('end', curry.threeOf4(this.infoFound, this, resolve, reject, tmplId));
            emitter.on('error', curry.oneOf2(this.infoError, this, reject));
        });
    }

    private infoError(reject: (reason?: any) => void, error: any): void {
        reject(error);
    }

    private infoFound(
        resolve: (value?: ITemplate | PromiseLike<ITemplate>) => void,
        reject: (reason?: any) => void,
        tmplId: string,
        list: ITemplate[]): void
    {
        let result: ITemplate = list.find(tmpl => tmpl.identity === tmplId);
        if (typeof result === "undefined") {
            reject(`Template with templateId "${tmplId}" was not found.`);
        } else {
            resolve(this.mapToViewModel(result));
        }
    }

    private listMatch(templatesRef: ITemplate[], tmpl: ITemplate): void {
        templatesRef.push(tmpl);
    }

    private endList(templatesRef: ITemplate[], emitter: EventEmitter<TemplateSearchEmitterType>): void {
        emitter.emit('end', templatesRef);
    }

    // For the moment, this exists only to eliminate comments from the JSON.
    // Later, we should look into mapper frameworks. None of them look great, atm (2017-06-24).
    private mapToViewModel(tmpl: ITemplate): ITemplate {
        return this.stripComments(tmpl);
    }

    private stripComments(obj: any, parent?: any, curKey?: string | number): any {        
        if (obj instanceof Array) {
            if (!parent) {
                throw new Error(this.msg.i18n().mf("Root-level configuration element cannot be an array."));
            }

            let stripped = [];
            for(var i=0; i<obj.length; i++) {
                if (typeof obj[i] !== "string" || obj[i].substr(0, 1) !== "#")
                {
                    stripped.push(this.stripComments(obj[i], obj, i));
                }
            }

            return stripped;
        } else if (typeof obj === "object") {
            for(var key in obj) {
                if (key === "#") {
                    delete obj[key];
                } else if (typeof obj[key] === "object") {
                    obj[key] = this.stripComments(obj[key], obj, key);
                }
            }
        }

        return obj;
    }

    private templateMatch(emitter: EventEmitter<TemplateSearchEmitterType>, file: string): any {
            let fullPath = this.path.join(this.tmplDir, file);
            try {
                let tmpl = JSON.parse(this.fs.readFileSync(fullPath, 'utf8'));
                let tmplAbsRoot = this.path.join(this.path.dirname(fullPath), '..');
                tmpl.__tmplPath = this.getTemplateRoot(tmpl, tmplAbsRoot);
                tmpl.__tmplConfigPath = tmplAbsRoot;
                emitter.emit("match", tmpl);
            } catch (ex) {
                emitter.emit("error", ex);
            }
    }

    private getTemplateRoot(tmpl: any, absRoot: string): string {
        let root = absRoot;
        if (typeof tmpl.root === "string") {
            root = this.path.join(absRoot, tmpl.root);
        } else if (typeof tmpl.root !== "undefined") {
            throw new Error(this.msg.i18n().mf("Element 'root' (JsonPath: $.root) within template.json must be a string."));
        }

        if (! this.fs.statSync(root).isDirectory) {
            throw new Error(this.msg.i18n({root}).mf("Template root is not a directory: {root}."));
        }

        return root;        
    }
}
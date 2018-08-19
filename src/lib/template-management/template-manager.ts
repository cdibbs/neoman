import { inject, injectable } from 'inversify';
import TYPES from '../di/types';
import { EventEmitter, TemplateSearchEmitterType } from '../emitters';
import { IFileSystem, IGlob, IPath, ISettingsProvider, IUserMessager } from '../i';
import { ITemplate } from '../i/template';
import KEYS from '../settings-keys';
import { curry } from '../util/curry';
import { ITemplateManager } from './i-template-manager';
import { TemplateManagerError } from './template-manager-error';
import { ITemplatePreprocessor } from './i-template-preprocessor';

@injectable()
export class TemplateManager implements ITemplateManager {
    private tmplDir: string;

    constructor(
        @inject(TYPES.SettingsProvider) protected settings: ISettingsProvider,
        @inject(TYPES.UserMessager) protected msg: IUserMessager,
        @inject(TYPES.FS) private fs: IFileSystem,
        @inject(TYPES.Path) private path: IPath,
        @inject(TYPES.Glob) private glob: IGlob,
        @inject(TYPES.TemplatePreprocessor) private tmplPrep: ITemplatePreprocessor
    ) {
        this.tmplDir = this.settings.get(KEYS.tempDirKey);
    }


    // Essentially, this maps a glob-match emitter to an ITemplate emitter
    /**
     * Builds an emitter to list templates in the template directory.
     * @param end A function accepting an ITemplate[] array to pre-bind to the returned emitter's "end" event.
     * @param error A function accepting a TemplateManagerError to pre-bind to the returned emitter's "error" event.
     * @param match A function accepting an ITemplate instance to pre-bind to the returned emitter's "match" event.
     */
    list(
        end?: (templates: ITemplate[]) => void,
        error?: (terror: TemplateManagerError) => void,
        match?: (tmpl: ITemplate) => void
    ): EventEmitter<TemplateSearchEmitterType> {
        let templates: ITemplate[] = [];
        let emitter = new EventEmitter<TemplateSearchEmitterType>();
        // on glob match, the following adds an ITemplate to templates for later return at "end" event:
        emitter.on("match", curry.oneOf2(this.listMatch, this, templates));
        if (match && match instanceof Function) {
            emitter.on("match", match);
        }
        if (end && end instanceof Function) {
            emitter.on("end", end);
        }
        if (error && error instanceof Function) {
            emitter.on("error", error);
        }

        let search = new this.glob.Glob("*/.neoman.config/template.json", { cwd: this.tmplDir });
        search.on("match", curry.oneOf2(this.templateMatch, this, emitter))
        search.on("end", curry.twoOf3(this.endList, this, templates, emitter));

        return emitter;
    }

    /**
     * Get info about the given template, if it exists.
     * @param tmplId Template identifier
     */
    async info(tmplId: string): Promise<ITemplate> {
        return new Promise<ITemplate>((resolve, reject) => {
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
            resolve(result);
        }
    }

    private listMatch(templatesRef: ITemplate[], tmpl: ITemplate): void {
        templatesRef.push(tmpl);
    }

    private endList(templatesRef: ITemplate[], emitter: EventEmitter<TemplateSearchEmitterType>): void {
        emitter.emit('end', templatesRef);
    }

    private templateMatch(emitter: EventEmitter<TemplateSearchEmitterType>, file: string): void {
        let fullPath;
        try {
            fullPath = this.path.join(this.tmplDir, file);
            const rawTmpl = JSON.parse(this.fs.readFileSync(fullPath, 'utf8'));
            const tmpl = this.tmplPrep.preprocess(rawTmpl);
            const tmplAbsRoot = this.path.join(this.path.dirname(fullPath), '..');
            tmpl.__tmplPath = this.getTemplateRoot(tmpl, tmplAbsRoot);
            tmpl.__tmplConfigPath = tmplAbsRoot;
            emitter.emit("match", tmpl);
        } catch (ex) {
            emitter.emit("error", new TemplateManagerError(ex, fullPath));
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
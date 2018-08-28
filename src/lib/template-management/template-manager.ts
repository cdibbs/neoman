import { inject, injectable } from 'inversify';
import TYPES from '../di/types';
import { EventEmitter, TemplateSearchEmitterType } from '../emitters';
import { IFileSystem, IGlob, IPath, ISettingsProvider, IUserMessager, ITemplate } from '../i';
import KEYS from '../settings-keys';
import { curry } from '../util/curry';
import { ITemplateManager } from './i-template-manager';
import { ITemplatePreprocessor } from './i-template-preprocessor';
import { TemplateManagerError } from './template-manager-error';
import { ISearchHandlerFactory } from './i-search-handler-factory';

@injectable()
export class TemplateManager implements ITemplateManager {
    private tmplDir: string;

    constructor(
        @inject(TYPES.SettingsProvider) protected settings: ISettingsProvider,
        @inject(TYPES.UserMessager) protected msg: IUserMessager,
        @inject(TYPES.Process) private process: NodeJS.Process,
        @inject(TYPES.Glob) private glob: IGlob,
        @inject(TYPES.SearchHandlerFactory) private searchHandlerFactory: ISearchHandlerFactory
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
        const templates: ITemplate[] = [];
        const userEmitter = new EventEmitter<TemplateSearchEmitterType>();
        // on glob match, the following adds an ITemplate to templates for later return at "end" event:
        userEmitter.on("match", curry.oneOf2(this.listMatch, this, templates));
        userEmitter.on("match", match);
        userEmitter.on("end", end);
        userEmitter.on("error", error);

        // Setup proxy emitters between the template repo globs and the userEmitter.
        // The user emitter serves to collate the different sources, and the proxy
        // methods also grant more desirable behavior (error handling, returning all
        // results at the end, etc).
        console.log(this.process, typeof this.process.cwd);
        const locations = {
            "*/.neoman.config/template.json": this.tmplDir,
            ".neoman/**/.neoman.config/template.json": this.process.cwd()
        };
        const searchHandler = this.searchHandlerFactory.build(locations);
        for (const path in locations) {
            const search = new this.glob.Glob(path, { cwd: locations[path] });
            search.on("match", curry.twoOf3(searchHandler.templateMatch, searchHandler, userEmitter, locations[path]));
            search.on("end", curry.threeOf4(searchHandler.endList, searchHandler, templates, userEmitter, path));
        }

        return userEmitter;
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
            reject(this.msg.mf('Template with templateId "{tmplId}" was not found.', {tmplId}));
        } else {
            resolve(result);
        }
    }

    private listMatch(templatesRef: ITemplate[], tmpl: ITemplate): void {
        templatesRef.push(tmpl);
    }


}
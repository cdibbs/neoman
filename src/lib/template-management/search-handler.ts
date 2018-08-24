import { TemplateSearchEmitterType, EventEmitter } from "../emitters";
import { ITemplate, IPath, IFileSystem, IUserMessager } from "../i";
import { TemplateManagerError } from "./template-manager-error";
import { ITemplatePreprocessor } from "./i-template-preprocessor";
import { ISearchHandler } from "./i-search-handler";

export class SearchHandler implements ISearchHandler {
    protected completedSearches: { [key: string]: boolean };

    constructor(
        protected msg: IUserMessager,
        protected path: IPath,
        protected fs: IFileSystem,
        protected tmplPrep: ITemplatePreprocessor,
        protected locations: { [key: string]: string }
    ) {
        this.completedSearches = {};
    }

    public endList(templatesRef: ITemplate[], emitter: EventEmitter<TemplateSearchEmitterType>, path: string): void {        
        this.completedSearches[path] = true;
        if (Object.keys(this.locations).every(k => this.completedSearches[k])) {
            emitter.emit('end', templatesRef);
        }
    }

    public templateMatch(emitter: EventEmitter<TemplateSearchEmitterType>, tmplDir: string, file: string): void {
        let fullPath;
        try {
            fullPath = this.path.join(tmplDir, file);
            const rawTmpl = JSON.parse(this.fs.readFileSync(fullPath, 'utf8'));
            const tmpl = this.tmplPrep.preprocess(rawTmpl);
            const tmplAbsRoot = this.path.join(this.path.dirname(fullPath), '..');
            tmpl.__tmplPath = this.getTemplateRoot(tmpl, tmplAbsRoot);
            tmpl.__tmplConfigPath = tmplAbsRoot;
            tmpl.__tmplRepo = tmplDir;
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
            throw new Error(this.msg.mf("Element 'root' (JsonPath: $.root) within template.json must be a string."));
        }

        if (! this.fs.statSync(root).isDirectory) {
            throw new Error(this.msg.mf("Template root is not a directory: {root}.", {root}));
        }

        return root;        
    }
}
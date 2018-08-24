import { inject, injectable } from "inversify";
import TYPES from "../di/types";
import { IUserMessager, IFileSystem, IPath } from "../i";
import { ITemplatePreprocessor } from ".";
import { SearchHandler } from "./search-handler";
import { ISearchHandlerFactory } from "./i-search-handler-factory";
import { ISearchHandler } from "./i-search-handler";

@injectable()
export class SearchHandlerFactory implements ISearchHandlerFactory {
    protected hndClass = SearchHandler;
    constructor(
        @inject(TYPES.UserMessager) protected msg: IUserMessager,
        @inject(TYPES.FS) private fs: IFileSystem,
        @inject(TYPES.Path) private path: IPath,
        @inject(TYPES.TemplatePreprocessor) private tmplPrep: ITemplatePreprocessor
    ) {

    }

    build(locations: { [key: string]: string }): ISearchHandler {
        return new this.hndClass(this.msg, this.path, this.fs, this.tmplPrep, locations);
    }
}
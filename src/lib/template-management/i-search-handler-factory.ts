import { ISearchHandler } from "./i-search-handler";

export interface ISearchHandlerFactory {
    build(locations: { [key: string]: string }): ISearchHandler;
}
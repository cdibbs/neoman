export interface IHandlerService {
    resolveAndLoad<T extends Function>(tmplConfigRootPath: string, handler: string): Promise<T>;
}
export interface IHandlerService {
    resolveAndLoadSync(tmplConfigRootPath: string, handler: string): Function;
    resolveAndLoad(tmplConfigRootPath: string, handler: string): Promise<Function>;
}
import { injectable, inject } from 'inversify';

import TYPES from './di/types';
import * as i from './i';

@injectable()
export class HandlerService implements i.IHandlerService{
    constructor(
        @inject(TYPES.FS) private fs: i.IFileSystem,
        @inject(TYPES.Path) private path: i.IPath,
    ) {

    }

    resolveAndLoad<T extends Function>(tmplConfigRootPath: string, handler: string): Promise<T> {
        return Promise.reject("not implemented");
    }
}
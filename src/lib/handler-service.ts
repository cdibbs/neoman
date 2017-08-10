import { injectable, inject } from 'inversify';
let NestedError = require('nested-error-stacks');
import * as fse from 'fs-extra';

import { curry } from './util/curry';
import TYPES from './di/types';
import * as i from './i';

@injectable()
export class HandlerService implements i.IHandlerService {
    constructor(
        @inject(TYPES.Path) private path: i.IPath,
        @inject(TYPES.UserMessager) private msg: i.IUserMessager
    ) {

    }

    resolveAndLoadSync(tmplConfigRootPath: string, handlerid: string): Function {
        let handlerPath = this.path.join(tmplConfigRootPath, '.neoman.config', 'handlers', this.formatPath(handlerid));
        try {
            this.accessSync(handlerPath, fse.constants.R_OK);
            let hnd = this.requireNative(handlerPath);
            if (typeof hnd !== 'function') {
                let errorMessage = this.msg.i18n({handlerPath}).__mf('Handler definition at {handlerPath} was not a function.');
                throw new Error(errorMessage);
            }
            return hnd;
        } catch(ex) {
            let errorMessage = this.msg.i18n({handlerPath}).__mf('Could not access user-defined handler at {handlerPath}.');
            throw new NestedError(errorMessage, ex);
        }
    }

    // We'll probably ditch the async, but we'll see...
    resolveAndLoad(tmplConfigRootPath: string, handlerid: string): Promise<Function> {
        let handlerPath = this.path.join(tmplConfigRootPath, '.neoman.config', 'handlers', this.formatPath(handlerid));
        return this
            .checkAndRequire(handlerPath)
            .then(curry.oneOf2(this.validateHandler, this, handlerPath));
    }

    formatPath(id: string): string {
        if (! id.endsWith(".js")) {
            return id + ".js";
        }
    }

    checkAndRequire(path: string): Promise<Function> {
        return this.access(path, fse.constants.R_OK)
            .then<Function>(curry.oneOf1(this.require, this, path))
            .catch(curry.oneOf2(this.noAccess, this, path));
    }

    private requireNative = require;
    protected require(path: string): Promise<Function> {
        return Promise.resolve<Function>(this.requireNative(path));
    }

    private accessSync = fse.accessSync;
    private access = fse.access;
    protected noAccess(handlerPath: string, ex: Error): Promise<Function> {
        let errorMessage = this.msg.i18n({handlerPath}).__mf('Could not access user-defined handler at {handlerPath}.');
        return Promise.reject<Function>(new NestedError(errorMessage, ex));
    }

    protected validateHandler(handlerPath: string, handler: Function): Promise<Function> {
        if (typeof handler !== 'function') {
            let errorMessage = this.msg.i18n({handlerPath}).__mf('Handler definition at {handlerPath} was not a function.');
            return Promise.reject(new Error(errorMessage));
        }

        return Promise.resolve<Function>(handler);
    }
}
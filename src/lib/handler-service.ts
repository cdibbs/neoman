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

    resolveAndLoad(tmplConfigRootPath: string, handlerid: string): Promise<Function> {
        let handlerPath = this.path.join(tmplConfigRootPath, 'handlers', handlerid);
        return this
            .checkAndRequire(handlerPath)
            .then(curry.oneOf2(this.validateHandler, this, handlerPath));
    }

    checkAndRequire(path: string): Promise<Function> {
        return this.access(path, fse.constants.R_OK)
            .then<Function>(curry.oneOf1(this.require, this, path))
            .catch(curry.oneOf2(this.noAccess, this, path));
    }

    requireNative = require;
    protected require(path: string): Promise<Function> {
        return Promise.resolve<Function>(this.requireNative(path));
    }

    access = fse.access;
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
import { injectable, inject } from 'inversify';
var NestedError = require('nested-error-stacks');

import { BaseInputManager } from './base-input-manager';
import TYPES from '../di/types';
import * as i from '../i';
import { RunOptions } from '../models';
import { IInputConfig } from '../i/template';

@injectable()
export class CustomInputManager extends BaseInputManager {
    constructor(
        @inject(TYPES.HandlerService) private handlerService: i.IHandlerService
    ) {
        super();
    }

    async ask(config: IInputConfig, options: RunOptions): Promise<{ [key: string]: any }> {
        try {
            const handler: Function = await this.handlerService
                .resolveAndLoad(this.tmplRootPath, config.handler);
            handler(config);
        } catch (ex) {
            return Promise.reject(new NestedError("Error running handler for input configuration", ex));
        }
    }
}
import { injectable, inject } from 'inversify';
var NestedError = require('nested-error-stacks');

import { BaseInputManager } from './base-input-manager';
import TYPES from '../di/types';
import * as i from '../i';
import * as it from '../i/template';

@injectable()
export class CustomInputManager extends BaseInputManager {
    constructor(
        @inject(TYPES.HandlerService) private handlerService: i.IHandlerService
    ) {
        super();
    }

    ask(config: it.IInputConfig): Promise<{ [key: string]: any }> {
        try {
            return this.handlerService
                .resolveAndLoad(this.tmplRootPath, config.handler)
                .then(handler => handler(config));
        } catch (ex) {
            return Promise.reject(new NestedError("Error running handler for input configuration", ex));
        }
    }
}
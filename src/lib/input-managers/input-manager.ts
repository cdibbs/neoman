import { injectable, inject } from 'inversify';
var NestedError = require('nested-error-stacks');

import { BaseInputManager } from './base-input-manager';
import TYPES from '../di/types';
import * as i from '../i';
import * as it from '../i/template';

@injectable()
export class InputManager extends BaseInputManager {
    constructor(
        @inject(TYPES.PromptInputManager) private promptMgr: i.IInputManager,
        @inject(TYPES.BrowserInputManager) private browserMgr: i.IInputManager,
        @inject(TYPES.CustomInputManager) private customMgr: i.IInputManager
    ) {
        super();
    }

    ask(config: it.IInputConfig): Promise<{ [key: string]: any }> {
        try {
            if (typeof config.use === "undefined") {
                // assume prompt
                return this.promptMgr.ask(config);
            } else if (typeof config.use === "string") {
                switch(config.use) {
                    case "browser": return this.browserMgr.ask(config);
                    case "prompt": return this.promptMgr.ask(config);
                    default:
                        this.customMgr.configure(this.tmplRootPath);
                        return this.customMgr.ask(config);
                }
            } else if (typeof config.use === "object") {
                switch(config.use.type) {
                    case "browser": return this.browserMgr.ask(config);
                    case "prompt": return this.promptMgr.ask(config);
                    default:
                        this.customMgr.configure(this.tmplRootPath);
                        return this.customMgr.ask(config);
                }
            }

            return Promise.reject(`Unrecognized input section format: ${config.use}.`);
        } catch(err) {
            return Promise.reject(new NestedError(`Unexpected error asking for ${(config || {}).use} input`, err));
        }
    }
}
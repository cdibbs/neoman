import { injectable, inject } from 'inversify';
var NestedError = require('nested-error-stacks');

import { BaseInputManager } from './base-input-manager';
import TYPES from '../di/types';
import * as i from '../i';
import * as it from '../i/template';
import { RunOptions } from '../models';

@injectable()
export class InputManager extends BaseInputManager {
    constructor(
        @inject(TYPES.PromptInputManager) private promptMgr: i.IInputManager,
        @inject(TYPES.BrowserInputManager) private browserMgr: i.IInputManager,
        @inject(TYPES.CustomInputManager) private customMgr: i.IInputManager,
        @inject(TYPES.DefaultsInputManager) private defaultsMgr: i.IInputManager,
        @inject(TYPES.UserMessager) private msg: i.IUserMessager
    ) {
        super();
    }

    ask(config: it.IInputConfig, options: RunOptions): Promise<{ [key: string]: any }> {
        if (typeof config === 'undefined') {
            return Promise.resolve({});
        }

        console.log(options);
        if (options.defaults) {
            return this.defaultsMgr.ask(config, options);
        }
        
        try {
            let use: it.ICustomInputInterface | string = config.use;

            if (typeof config.use === "undefined") {
                // assume prompt
                return this.promptMgr.ask(config, options);
            } else if (typeof config.use === "string") {
                use = this.generateDefaults(config.use);
            }
            
            if (typeof use === "object") {
                switch(use.type) {
                    case "browser": return this.browserMgr.ask(config, options);
                    case "prompt": return this.promptMgr.ask(config, options);
                    default:
                        this.customMgr.configure(this.tmplRootPath);
                        return this.customMgr.ask(config, options);
                }
            }

            return Promise.reject(`Unrecognized input section format: ${use}.`);
        } catch(err) {
            return Promise.reject(new NestedError(`Unexpected error asking for ${config.use} input`, err));
        }
    }

    generateDefaults(use: string): it.ICustomInputInterface {
        return <it.ICustomInputInterface>{
            type: use,
            handler: null,
            handlerConfig: null
        };
    }
}
import { inject, injectable } from 'inversify';
import TYPES from '../di/types';
import { RunOptions } from '../models';
import { IInputConfig, IComplexInputDef, InputConfigType, InputInterfaceConfig } from '../user-extensibility';
import { BaseInputManager } from './base-input-manager';
import { IInputManager, IUserMessager } from '../i';
var NestedError = require('nested-error-stacks');


@injectable()
export class InputManager extends BaseInputManager {
    constructor(
        @inject(TYPES.PromptInputManager) private promptMgr: IInputManager,
        @inject(TYPES.BrowserInputManager) private browserMgr: IInputManager,
        @inject(TYPES.CustomInputManager) private customMgr: IInputManager,
        @inject(TYPES.DefaultsInputManager) private defaultsMgr: IInputManager,
        @inject(TYPES.UserMessager) private msg: IUserMessager
    ) {
        super();
    }

    async ask(config: IInputConfig, options: RunOptions): Promise<{ [key: string]: any }> {
        if (typeof config === 'undefined' || config === null) {
            return {};
        }

        if (options && options.defaults) {
            return await this.defaultsMgr.ask(config, options);
        }

        let use: InputConfigType = config.use;        
        try {

            if (typeof config.use === "undefined") {
                // assume prompt
                return await this.promptMgr.ask(config, options);
            } else if (typeof config.use === "string") {
                use = this.generateDefaults(config.use);
            }
            
            if (typeof use === "object") {
                switch(use.type) {
                    case "browser": return await this.browserMgr.ask(config, options);
                    case "prompt": return await this.promptMgr.ask(config, options);
                    default:
                        this.customMgr.configure(this.tmplRootPath);
                        return await this.customMgr.ask(config, options);
                }
            }
        } catch (err) {
            throw new NestedError(`Unexpected error asking for ${config.use} input`, err);
        }

        throw new Error(`Unrecognized input section format: ${use}.`);
    }

    protected generateDefaults(use: string): InputInterfaceConfig {
        return <InputInterfaceConfig>{
            type: use,
            handler: null,
            handlerConfig: null
        };
    }
}
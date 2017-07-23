import { injectable, inject } from 'inversify';
import TYPES from '../di/types';

import * as i from '../i';
import * as it from '../i/template';

@injectable()
export class InputManager implements i.IInputManager {
    constructor(
        @inject(TYPES.PromptInputManager) private promptMgr: i.IInputManager,
        @inject(TYPES.BrowserInputManager) private browserMgr: i.IInputManager,
        @inject(TYPES.CustomInputManager) private customMgr: i.IInputManager
    ) {}

    ask(config: it.IInputConfig): Promise<{ [key: string]: any }> {
        try {
            if (typeof config.use === "undefined") {
                // assume prompt
                return this.promptMgr.ask(config);
            } else if (typeof config.use === "string") {
                switch(config.use) {
                    case "browser": return this.browserMgr.ask(config);
                    case "prompt": return this.promptMgr.ask(config);
                    default: return this.customMgr.ask(config);
                }
            } else if (typeof config.use === "object") {
                switch(config.use.type) {
                    case "browser": return this.browserMgr.ask(config);
                    case "prompt": return this.promptMgr.ask(config);
                    default: return this.customMgr.ask(config);
                }
            }

            return new Promise((_, reject) => reject("Unrecognized input section format."));
        } catch(err) {
            return new Promise((_, reject) => reject(err));
        }
    }

    protected countQuestions(inputs: it.ITemplateInputs): number {
        if (typeof inputs === "object") {
            return Object.keys(inputs).length;
        }

        throw new Error("Unrecognized input section format.");
    }
}
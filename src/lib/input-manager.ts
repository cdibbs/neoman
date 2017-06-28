import * as i from './i';
import * as it from './i/template';

export class InputManager implements i.IInputManager {
    ask(config: it.IInputConfig): { [key: string]: any } {
        if (typeof config.userInterface === "undefined") {
            // assume prompt
            return this.prompt(config);
        } else if (typeof config.userInterface === "string") {
            switch(config.userInterface) {
                case "browser": return this.browser(config);
                case "prompt": return this.prompt(config);
                default: return this.custom(config);
            }
        } else if (typeof config.userInterface === "object") {
            switch(config.userInterface.type) {
                case "browser": return this.browser(config);
                case "prompt": return this.prompt(config);
                default: return this.custom(config);
            }
        }

        throw new Error("Unrecognized inputConfig format.");
    }

    prompt(config: it.IInputConfig): { [key: string]: any } {
        
    }

    browser(config: it.IInputConfig): { [key: string]: any } {

    }

    custom(config: it.IInputConfig): { [key: string]: any } {

    }

    protected countQuestions(inputs: it.ITemplateInputs): number {
        if (typeof inputs === "object") {
            return Object.keys(inputs).length;
        }

        throw new Error("Unrecognized inputConfig format.");
    }
}
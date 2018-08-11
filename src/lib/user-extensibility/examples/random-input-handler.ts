import { ICapabilities } from "../i-capabilities";
import { IInputHandler } from "../i-input-handler";
import { IInputConfig } from "../i-input-config";

function RandomInputHandler(capabilities: ICapabilities, config?: IInputConfig): { [key: string]: any} {
    const answers = {};
    if (! config) {
        return answers;
    }

    for(let k in config) {
        answers[k] = Math.random();
    }

    return answers;
}

// You can omit this, if you don't want to specify your requirements.
namespace RandomInputHandler {
    export const requiredCapabilities: ICapabilities = {
        version: "1.0.0-alpha.1",
        plugins: []
    };

    export const desiredCapabilities: ICapabilities = {
        version: "1.0.0",
        plugins: []
    };
}

/**
 * Exporting the result of an immediate, anonymous factory call
 * affords us type safety with IInputHandler.
 */
export = (): IInputHandler => { return RandomInputHandler; };
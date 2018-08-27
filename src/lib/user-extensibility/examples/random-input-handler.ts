import { ICapabilities } from "../i-capabilities";
import { IInputHandler } from "../i-input-handler";
import { IInputConfig } from "../template/i-input-config";
import { INeedy } from "../i-needy";
import { ICapabilitiesHelper } from "../i-capabilities-helper";

function RandomInputHandler(capabilities: ICapabilitiesHelper, config?: IInputConfig): { [key: string]: any} {
    const answers = {};
    if (! config) {
        return answers;
    }

    for(const k in config) {
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

export = <INeedy> <typeof RandomInputHandler> <IInputHandler> RandomInputHandler /* type safety */;
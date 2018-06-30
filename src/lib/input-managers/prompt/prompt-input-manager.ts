import { injectable, inject } from 'inversify';
import TYPES from '../../di/types';

import { BaseInputManager } from '../base-input-manager';
import { curry } from '../../util/curry';
import * as i from '../../i';
import * as it from '../../i/template';
import { RunOptions } from '../../models';

@injectable()
export class PromptInputManager extends BaseInputManager {
    constructor(
        @inject(TYPES.Process) private process: NodeJS.Process,
        @inject(TYPES.UserMessager) private msg: i.IUserMessager
    ) {
        super();
    }

    async ask(config: it.IInputConfig, options: RunOptions): Promise<{ [key: string]: any }> {
        const count = this.countQuestions(config.define);
        let current = 1;
        let answers = {};
        for(let key in config.define) {
            const qtext = `(${current}/${count}) ${config.define[key]} `;
            // Wrap the NodeJS callback stuff with a promise.
            answers[key] = await new Promise(curry.twoOf4(this.promptWithCallback, this, key, qtext));
            current = current + 1;
        }

        return answers;
    }

    protected promptWithCallback(
        key: string,
        question: string | it.ITemplateTypedInput | it.ITemplateScriptedInput,
        callback: (data: any) => void,
        errorCallback: (e: Error) => void): void
    {
        try {
            if (typeof question !== "string")
                throw new Error(this.msg.i18n({key}).mf("Question definition for key '{key}' erroneous or not supported, yet."));

            this.process.stdin.resume();
            this.process.stdout.write(question, () => {});
            this.process.stdin.once('data', (data: any) => callback(data.toString().trim()));
        } catch(err) {
            errorCallback(err);
        }
    }

    protected countQuestions(inputs: it.ITemplateInputs): number {
        if (inputs === null || inputs === undefined) {
            return 0;
        } else if (typeof inputs === "object") {
            return Object.keys(inputs).length;
        }

        throw new Error(this.msg.i18n().mf("Unrecognized input section format."));
    }
}
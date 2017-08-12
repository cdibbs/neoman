import { injectable, inject } from 'inversify';
import TYPES from '../di/types';

import { BaseInputManager } from './base-input-manager';
import * as i from '../i';
import * as it from '../i/template';

@injectable()
export class PromptInputManager extends BaseInputManager {
    constructor(
        @inject(TYPES.Process) private process: NodeJS.Process,
        @inject(TYPES.UserMessager) private msg: i.IUserMessager
    ) {
        super();
    }

    ask(config: it.IInputConfig): Promise<{ [key: string]: any }> {
        let promise: Promise<{ [key: string]: any }> = null;
        let count = Object.keys(config.define).length;
        let current = 0;
        for(let key in config.define) {
            let q = `(${current + 1}/${count}) ${config.define[key]}`;
            if (promise === null) {
                promise = this.prompt(q).then(a => { let answers = {}; answers[key] = a; return answers; });
            } else {
                promise = promise.then((answers: { [key: string]: any }) => {
                    return this.prompt(q).then(a => { answers[key] = a; return answers; });
                })
            }
        }

        return promise || new Promise(resolve => resolve({}));
    }

    protected prompt(question: string | it.ITemplateTypedInput | it.ITemplateScriptedInput ): Promise<string> {
        return new Promise((resolve, reject) => {
            try {
                if (typeof question !== "string")
                    throw new Error(this.msg.i18n().mf("Not supported, yet."));

                this.process.stdin.resume();
                this.process.stdout.write(question, () => {});
                this.process.stdin.once('data', function (data: any) {
                    resolve(data.toString().trim());
                });
            } catch(err) {
                reject(err);
            }
        });
    }

    protected countQuestions(inputs: it.ITemplateInputs): number {
        if (typeof inputs === "object") {
            return Object.keys(inputs).length;
        }

        throw new Error(this.msg.i18n().mf("Unrecognized input section format."));
    }
}
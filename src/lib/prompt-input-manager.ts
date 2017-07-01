import { injectable, inject } from 'inversify';
import TYPES from './di/types';

import * as i from './i';
import * as it from './i/template';

@injectable()
export class PromptInputManager implements i.IInputManager {
    constructor(
        @inject(TYPES.Process) private process: NodeJS.Process
    ) {}

    ask(config: it.IInputConfig): Promise<{ [key: string]: any }> {
        console.log("here")
        let promise: Promise<{ [key: string]: any }> = null;
        for(let key in config.define) {
            let q = config.define[key];
            console.log(key, q);
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
                    throw new Error("Not supported, yet.");

                this.process.stdout.write(question);
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

        throw new Error("Unrecognized inputConfig format.");
    }
}
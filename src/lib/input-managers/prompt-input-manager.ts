import { injectable, inject } from 'inversify';
import TYPES from '../di/types';

import { BaseInputManager } from './base-input-manager';
import { curry } from '../util/curry';
import * as i from '../i';
import * as it from '../i/template';
import { RunOptions } from '../models';

@injectable()
export class PromptInputManager extends BaseInputManager {
    constructor(
        @inject(TYPES.Process) private process: NodeJS.Process,
        @inject(TYPES.UserMessager) private msg: i.IUserMessager
    ) {
        super();
    }

    ask(config: it.IInputConfig, options: RunOptions): Promise<{ [key: string]: any }> {
        let promise: Promise<{ [key: string]: any }> = null;
        let count = this.countQuestions(config.define);
        let current = 0;
        for(let key in config.define) {
            let q = `(${current + 1}/${count}) ${config.define[key]}`;
            if (promise === null) {
                promise = this.askNextQuestion(key, q, {});
            } else {
                promise = promise.then(curry.twoOf3(this.askNextQuestion, this, key, q));
            }
        }

        return promise || Promise.resolve({});
    }

    protected askNextQuestion(key: string, q: string, answers: { [key: string]: any }): Promise<{ [key: string]: any }>
    {
        return this.prompt(q).then(curry.twoOf3(this.acceptInput, this, answers, key));
    }

    protected acceptInput(answers: { [key: string]: any }, key: string, answer: any): { [key: string]: any }
    {
        answers[key] = answer;
        return answers
    }

    protected prompt(question: string | it.ITemplateTypedInput | it.ITemplateScriptedInput ): Promise<string>
    {
        return new Promise(curry.oneOf3(this.promptCallback, this, question));
    }

    protected promptCallback(
        question: string | it.ITemplateTypedInput | it.ITemplateScriptedInput,
        callback: (data: any) => void,
        errorCallback: (e: Error) => void): void
    {
        try {
            if (typeof question !== "string")
                throw new Error(this.msg.i18n().mf("Not supported, yet."));

            this.process.stdin.resume();
            this.process.stdout.write(question, () => {});
            this.process.stdin.once('data', curry.oneOf2(this.awaitInput, this, callback));
        } catch(err) {
            errorCallback(err);
        }
    }

    protected awaitInput(callback: (data: any) => void, data: any): void
    {
        callback(data.toString().trim());
    }

    protected countQuestions(inputs: it.ITemplateInputs): number {
        if (typeof inputs === "object") {
            return Object.keys(inputs).length;
        }

        throw new Error(this.msg.i18n().mf("Unrecognized input section format."));
    }
}
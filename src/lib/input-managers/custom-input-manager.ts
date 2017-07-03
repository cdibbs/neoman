import { injectable, inject } from 'inversify';
import TYPES from '../di/types';

import * as i from '../i';
import * as it from '../i/template';

@injectable()
export class CustomInputManager implements i.IInputManager {
    constructor(
    ) {}

    ask(config: it.IInputConfig): Promise<{ [key: string]: any }> {
        let answers = {};
        let promise = null;

        return promise || new Promise(resolve => resolve({}));
    }

    protected countQuestions(inputs: it.ITemplateInputs): number {
        if (typeof inputs === "object") {
            return Object.keys(inputs).length;
        }

        throw new Error("Unrecognized inputConfig format.");
    }
}
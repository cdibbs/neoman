import { injectable } from 'inversify';
import { RunOptions } from '../../models';
import { IInputConfig, ITemplateComplexInput, TemplateInput, IHandlerReference } from '../../user-extensibility';
import { BaseInputManager } from '../base-input-manager';
var NestedError = require('nested-error-stacks');

@injectable()
export class ArgvInputManager extends BaseInputManager {

    constructor(
        
    ) {
        super();
    }

    async ask(config: IInputConfig, options: RunOptions): Promise<{ [key: string]: any }> {
        let dict = {};
        if (!config || !config.define)
        {
            return dict;
        }

        for(let key in config.define) {
            dict[key] = this.findAnswer(options, config.define[key]);
        }

        return dict;
    }

    findAnswer(options: RunOptions, def: TemplateInput): any {
        if (! options.extraArgs || options.extraArgs.length === 0) {
            return "";
        }

        if (! def) {
            return this.findAnswerSimple(options, <any>def);
        } else if (typeof def === "string") {
            return this.findAnswerSimple(options, def);
        } else if (def && def["handler"]) {
            return this.findAnswerHandler(options, <IHandlerReference> def);
        } else if (def && def["prompt"]) {
            return this.findAnswerComplex(options, <ITemplateComplexInput> def);
        }
    }

    protected findAnswerSimple(options: RunOptions, def?: string) {
        
    }

    protected findAnswerHandler(options: RunOptions, def: IHandlerReference) {

    }

    protected findAnswerComplex(options: RunOptions, def: ITemplateComplexInput) {

    }
}
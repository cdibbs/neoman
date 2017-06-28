import { ITemplateInputs } from './i-template-inputs';
import * as it from './template';

export interface IInputManager {
    ask(tmpl: it.ITemplate, inputs: ITemplateInputs): any;
}
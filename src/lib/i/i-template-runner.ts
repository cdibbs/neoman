import { ITemplate } from './template';
import { Verbosity } from '../commands';

export interface ITemplateRunner {
    run(tmpl: ITemplate, path: string, verbosity: Verbosity, showExcluded: boolean): void;
}
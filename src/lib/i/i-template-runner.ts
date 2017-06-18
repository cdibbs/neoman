import { ITemplate } from './template';
import { Verbosity } from '../commands';

export interface ITemplateRunner {
    run(path: string, verbosity: Verbosity, showExcluded: boolean, tmpl: ITemplate): void;
}
import { ITemplate } from './template';
import { Verbosity } from '../types/verbosity';
import { RunOptions, RunnerResult } from '../models';

export interface ITemplateRunner {
    run(path: string, options: RunOptions, tmpl: ITemplate): Promise<RunnerResult>
}
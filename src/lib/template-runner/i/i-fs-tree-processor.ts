import { ITemplate } from '../../i/template';
import { RunOptions, RunnerResult } from '../../models';

export interface IFSTreeProcessor {
    process(srcPath: string, destPath: string, options: RunOptions, inputs: { [key: string]: any }, tmpl: ITemplate): Promise<RunnerResult>
}
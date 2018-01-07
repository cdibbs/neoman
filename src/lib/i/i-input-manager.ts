import { IInputConfig } from './template';
import * as it from './template';
import { RunOptions } from '../models';

export interface IInputManager {
    configure(tmplRootPath: string): void;
    ask(inputs: IInputConfig, options: RunOptions): Promise<{ [key: string]: any }>;
}
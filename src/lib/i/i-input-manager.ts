import { IInputConfig } from './template';
import * as it from './template';

export interface IInputManager {
    configure(tmplRootPath: string): void;
    ask(inputs: IInputConfig): Promise<{ [key: string]: any }>;
}
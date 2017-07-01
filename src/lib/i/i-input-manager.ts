import { IInputConfig } from './template';
import * as it from './template';

export interface IInputManager {
    ask(inputs: IInputConfig): Promise<{ [key: string]: any }>;
}
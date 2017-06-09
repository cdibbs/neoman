import { COMMANDS } from '../commands';
import { ICommand } from './i-command';

export interface ICommandFactory {
    build(type: keyof typeof COMMANDS, tempDir: string): ICommand<any, any>;
}
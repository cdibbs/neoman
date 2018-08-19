import { Commands } from '../commands';
import { ICommand } from './i-command';
import { Command } from 'commandpost/lib';

export interface ICommandFactory {
    build<TOpts, TArgs>(type: Commands, tempDir: string, cmd: Command<TOpts, TArgs>): ICommand<TOpts, TArgs>;
}
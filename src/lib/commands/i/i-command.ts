import { Commands } from '../commands';
import Command from 'commandpost/lib/command';
import { CommandValidationResult } from '../models';

export interface ICommand<TOpts, TArgs> {
    type: Commands;
    tempDir: string;
    run(cmd: Command<TOpts, TArgs>, opts: TOpts, args: TArgs): Promise<{}>;
}
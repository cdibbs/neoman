import { injectable, inject } from 'inversify';
import 'reflect-metadata';
import { COMMANDS, Commands } from './commands';
import { ICommand } from './i';
import { IUserMessager } from '../i';
import TYPES from '../di/types';
import Command from 'commandpost/lib/command';
import { CommandValidationResult, CommandErrorType } from '../models';

@injectable()
export abstract class BaseCommand<TOpts, TArgs> implements ICommand<TOpts, TArgs> {
    public tempDir: string = null;
    public type: Commands;

    constructor(
        @inject(TYPES.UserMessager) protected msg: IUserMessager,
        @inject(TYPES.Process) protected process: NodeJS.Process
    ) {}

    public abstract run(cmd: Command<TOpts, TArgs>, opts: TOpts, args: TArgs): Promise<{}>;

    protected async validate(cmd: Command<TOpts, TArgs>, opts: TOpts, args: TArgs): Promise<CommandValidationResult>
    {
        if (! this.tempDir || ! this.tempDir.trim()) {
            let v = new CommandValidationResult();
            let missingTemplateDir = this.msg.i18n().mf("You have not set a template directory. Please run setdir, first.");
            v.Messages.push(missingTemplateDir);
            v.ErrorType = CommandErrorType.UserError;
            return v;
        }

        return new CommandValidationResult();
    }
}
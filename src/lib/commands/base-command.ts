import { injectable, inject } from 'inversify';
import 'reflect-metadata';
import { COMMANDS, Commands } from './commands';
import { ICommand } from './i';
import { IUserMessager } from '../i';
import TYPES from '../di/types';

@injectable()
export class BaseCommand<TOpts, TArgs> implements ICommand<TOpts, TArgs> {
    public tempDir: string = null;
    public type: Commands;

    constructor(
        @inject(TYPES.UserMessager) protected msg: IUserMessager,
        @inject(TYPES.Process) protected process: NodeJS.Process
    ) {}

    public run(opts: TOpts, args: TArgs): Promise<{}> {
        if (! this.tempDir || ! this.tempDir.trim()) {
            this.msg.i18n().error("You have not set a template directory. Please run setdir, first.");
            this.process.exit(1); // can be no-op in integ tests
        }

        return Promise.resolve(null);
    }
}
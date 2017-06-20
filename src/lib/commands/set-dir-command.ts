import { inject, injectable } from 'inversify';
import { Commands, COMMANDS } from './commands';
import { BaseCommand } from './base-command';
import { ISettingsProvider, IFileSystem, IUserMessager } from '../i';
import KEYS from '../settings-keys';
import TYPES from '../di/types';

@injectable()
export class SetDirCommand extends BaseCommand<any, any> {
    type: Commands = COMMANDS.SetDir;

    constructor(
        @inject(TYPES.UserMessager) protected msg: IUserMessager,
        @inject(TYPES.Process) protected process: NodeJS.Process,
        @inject(TYPES.SettingsProvider) private settings: ISettingsProvider,
        @inject(TYPES.FS) private fs: IFileSystem
    ) {
        super(msg, process);
    }

    run(opts: any, args: any) {
        this.msg.info(`Setting directory to ${args.directory}`);

        let stats = null;
        try {
            stats = this.fs.statSync(args.directory);
        } catch(ex) {
            this.msg.warn(ex);
            this.msg.warn(`Warning: directory '${args.directory}' does not exist`);
            return;
        }

        if (! stats.isDirectory()) {
            this.msg.warn(`Warning: Not a directory: '${args.directory}.`);
        }
        
        this.settings.set(KEYS.tempDirKey, args.directory);
    }
}
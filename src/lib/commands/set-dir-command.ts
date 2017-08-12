import { inject, injectable } from 'inversify';
import { Commands, COMMANDS } from './commands';
import { BaseCommand } from './base-command';
import * as i from '../i';
import KEYS from '../settings-keys';
import TYPES from '../di/types';

@injectable()
export class SetDirCommand extends BaseCommand<any, any> {
    type: Commands = COMMANDS.SetDir;

    constructor(
        @inject(TYPES.UserMessager) protected msg: i.IUserMessager,
        @inject(TYPES.Process) protected process: NodeJS.Process,
        @inject(TYPES.SettingsProvider) private settings: i.ISettingsProvider,
        @inject(TYPES.FS) private fs: i.IFileSystem,
        @inject(TYPES.Path) private path: i.IPath
    ) {
        super(msg, process);
    }

    run(opts: any, args: any) {
        let imsg = this.msg.i18n({dir: args.directory});
        imsg.info('Setting directory to {dir}');

        let stats = null;
        try {
            stats = this.fs.statSync(args.directory);
        } catch(ex) {
            this.msg.warn(ex);
            imsg.warn("Error accessing '{dir}'.");
            return;
        }

        if (! stats.isDirectory()) {
            imsg.warn("Warning: Not a directory: '{dir}'.");
        }
        
        this.settings.set(KEYS.tempDirKey, this.path.resolve(args.directory));
    }
}
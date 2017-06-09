import { inject, injectable } from 'inversify';
import { Commands, COMMANDS } from './commands';
import { BaseCommand } from './base-command';
import { ISettingsProvider, IFileSystem } from '../i';
import KEYS from '../settings-keys';
import TYPES from '../di/types';

@injectable()
export class SetDirCommand extends BaseCommand<any, any> {
    type: Commands = COMMANDS.SetDir;

    constructor(
        @inject(TYPES.SettingsProvider) private settings: ISettingsProvider,
        @inject(TYPES.FS) private fs: IFileSystem
    ) {
        super();
    }

    run(opts: any, args: any) {
        console.log(`Setting directory to ${args.directory}`);

        let stats = null;
        try {
            stats = this.fs.statSync(args.directory);
        } catch(ex) {
            console.log(ex);
            console.warn(`Warning: directory '${args.directory}' does not exist`);
            return;
        }

        if (! stats.isDirectory()) {
            console.warn(`Warning: Not a directory: '${args.directory}.`);
        }
        
        this.settings.set(KEYS.tempDirKey, args.directory);
    }
}
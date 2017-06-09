import { injectable, inject } from 'inversify';
import { Commands, COMMANDS } from './commands';
import { BaseCommand } from './base-command';
import { INewCmdArgs, INewCmdOpts, IPath } from '../i';
import TYPES from '../di/types';

@injectable()
export class NewCommand extends BaseCommand<INewCmdOpts, INewCmdArgs> {
    type: Commands = COMMANDS.NewProject;

    constructor(
        @inject(TYPES.Process) private process: NodeJS.Process,
        @inject(TYPES.Path) private path: IPath
    ) {
       super(); 
    }

    run(opts: INewCmdOpts, args: INewCmdArgs): void {
        let cwd = this.process.cwd();
        let cwdBottom = cwd.split(this.path.sep).pop();
        let optsName = opts.name.join(' ').trim();
        let name = optsName || cwdBottom;
        console.log(`Generating project ${name} from template ${args.template}...`);
    }
}
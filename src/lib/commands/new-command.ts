import { injectable, inject } from 'inversify';
import { Commands, COMMANDS } from './commands';
import { BaseCommand } from './base-command';
import { IPath, IUserMessager } from '../i';
import { INewCmdArgs, INewCmdOpts } from './i';
import TYPES from '../di/types';

@injectable()
export class NewCommand extends BaseCommand<INewCmdOpts, INewCmdArgs> {
    type: Commands = COMMANDS.NewProject;

    constructor(
        @inject(TYPES.UserMessager) protected msg: IUserMessager,
        @inject(TYPES.Process) protected process: NodeJS.Process,
        @inject(TYPES.Path) private path: IPath
    ) {
       super(msg, process); 
    }

    run(opts: INewCmdOpts, args: INewCmdArgs): void {
        super.run(opts, args);

        let cwd = this.process.cwd();
        let cwdBottom = cwd.split(this.path.sep).pop();
        let optsName = opts.name.join(' ').trim();
        let name = optsName || cwdBottom;
        this.msg.log(`Generating project ${name} from template ${args.template}...`);
    }
}
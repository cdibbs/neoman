import { injectable, inject } from 'inversify';
import * as fse from 'fs-extra';
import * as minimatch from 'minimatch';

import { Commands, COMMANDS } from './commands';
import { Verbosity, VERBOSITY } from '../types/verbosity';
import { RunOptions } from '../models';
import { BaseCommand } from './base-command';
import { IPath, IUserMessager, ITemplateManager, IGlob, IFileSystem, ITemplateFile, ITemplateRunner } from '../i';
import { IEventEmitter } from '../emitters/i';
import { TemplateFilesEmitterType, EventEmitter } from '../emitters';
import { INewCmdArgs, INewCmdOpts } from './i';
import TYPES from '../di/types';

@injectable()
export class NewCommand extends BaseCommand<INewCmdOpts, INewCmdArgs> {
    type: Commands = COMMANDS.NewProject;

    constructor(
        @inject(TYPES.UserMessager) protected msg: IUserMessager,
        @inject(TYPES.TemplateManager) protected tmplMgr: ITemplateManager,
        @inject(TYPES.Path) private path: IPath,
        @inject(TYPES.TemplateRunner) private trunner: ITemplateRunner
    ) {
        super(msg, process);
    }

    run(opts: INewCmdOpts, args: INewCmdArgs): Promise<any> {
        super.run(opts, args);

        let cwd = this.process.cwd(), cdname = cwd.split(this.path.sep).pop();
        let optsName = opts.name.join(' ').trim();
        let name = optsName || cdname;
        let path = opts.path[0] || cwd;        
        this.msg.write(`Generating project ${name} from template ${args.template}...`);
        return this.tmplMgr
            .info(args.template)
            .then(this.trunner.run.bind(this.trunner, path, this.buildOptions(opts)))
            .then(() => {
                this.process.exit();
            })
            .catch(err => {
                this.msg.error(err.stack || err);
                this.msg.info("Aborting.");
                this.process.exit();
            });
    }

    buildOptions(opts: INewCmdOpts): RunOptions {
        let options = new RunOptions();
        options.verbosity = <Verbosity>opts.verbosity[0] || options.verbosity;
        options.showExcluded = (typeof opts.showExcluded !== "boolean") || options.showExcluded;
        return options;
    }
}
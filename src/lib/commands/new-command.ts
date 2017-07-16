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
        let options = this.buildOptions(opts);
        this.msg.write(`Generating project ${options.name} from template ${args.template}...`);
        return this.tmplMgr
            .info(args.template)
            .then(this.trunner.run.bind(this.trunner, options.path, options))
            .then(this.exit.bind(this))
            .catch(this.handleTmplRunnerError.bind(this));
    }

    buildOptions(opts: INewCmdOpts): RunOptions {
        let cwd = this.process.cwd(), cdname = cwd.split(this.path.sep).pop();
        let optsName = (opts.name || []).join(' ').trim();   
        let options = new RunOptions();
        options.name = optsName || cdname;
        options.path = (opts.path || [])[0] || cwd;
        options.verbosity = <Verbosity>(opts.verbosity || [])[0] || options.verbosity;
        options.showExcluded = (typeof opts.showExcluded !== "boolean") || options.showExcluded;
        return options;
    }

    protected handleTmplRunnerError(err: Error) {
        this.msg.error(err.stack || err);
        this.msg.info("Aborting.");
        this.exit();
    }

    protected exit() {
        this.process.exit();
    }
}
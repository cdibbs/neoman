import { injectable, inject } from 'inversify';
import * as fse from 'fs-extra';
import * as minimatch from 'minimatch';

import { Commands, COMMANDS } from './commands';
import { Verbosity, VERBOSITY } from './verbosity';
import { BaseCommand } from './base-command';
import { IPath, IUserMessager, ITemplateManager, IGlob, IFileSystem, ITemplateFile, ITemplateRunner } from '../i';
import { ITemplate, ReplacementsDefinition, IReplacementDefinition } from '../i/template';
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

    run(opts: INewCmdOpts, args: INewCmdArgs): void {
        super.run(opts, args);

        let cwd = this.process.cwd(), cdname = cwd.split(this.path.sep).pop();
        let optsName = opts.name.join(' ').trim();
        let name = optsName || cdname;
        let path = opts.path[0] || cwd;        
        this.msg.write(`Generating project ${name} from template ${args.template}...`);
        this.msg.write(`Copying and transforming files into ${path}`);
        this.tmplMgr.info(args.template)
            .then(this.trunner.run.bind(this.trunner, path, opts.verbosity[0], opts.showExcluded))
            .catch(err => console.error(err));
    }
}
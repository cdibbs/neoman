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
import Command from 'commandpost/lib/command';
import { curry } from '../util/curry';
import { CommandValidationResult, CommandErrorType } from './models';

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

    run(cmdDef: Command<INewCmdOpts, INewCmdArgs>, opts: INewCmdOpts, args: INewCmdArgs): Promise<CommandValidationResult> {
        let promise = this.validate(cmdDef, opts, args)
            .then(curry.twoOf3(this.runWithValidArgs, this, opts, args))
            .catch(curry.bindOnly(this.reportError, this));

        return promise;
    }

    public runWithValidArgs(opts: INewCmdOpts, args: INewCmdArgs, validationResult: CommandValidationResult): Promise<any> {
        let options = this.buildOptions(opts);
        this.msg.write(`Generating project ${options.name} from template ${args.templateId}...`);        
        return this.tmplMgr
            .info(args.templateId)
            .then(curry.twoOf3(this.trunner.run, this.trunner, options.path, options))
            .then(this.exit.bind(this))
            .catch(this.reportError.bind(this));
    }

    public validate(cmd: Command<INewCmdOpts, INewCmdArgs>, opts: INewCmdOpts, args: INewCmdArgs): Promise<CommandValidationResult> {
        let promise: Promise<CommandValidationResult>;
        if (! args.templateId) {
            var v = new CommandValidationResult();
            v.Message = this.msg.i18n({helptext: cmd.helpText()}).mf("You must specify a template identifier.\n\n{helptext}");
            v.ErrorType = CommandErrorType.UserError;
            promise = Promise.reject(v);
        } else {
            promise = Promise.resolve(new CommandValidationResult());
        }

        return promise.then(curry.threeOf4(super.validate, this, cmd, opts, args));
    }

    buildOptions(opts: INewCmdOpts): RunOptions {
        let cwd = this.process.cwd(), cdname = cwd.split(this.path.sep).pop();
        let optsName = (opts.name || []).join(' ').trim();   
        let options = new RunOptions();
        options.name = optsName || cdname;
        options.path = (opts.path || [])[0] || cwd;
        options.verbosity = <Verbosity>(opts.verbosity || [])[0] || options.verbosity;
        options.showExcluded = (typeof opts.showExcluded !== "boolean") || options.showExcluded;
        options.defaults = !! opts.defaults;
        return options;
    }

    reportError(err: Error | CommandValidationResult): void {
        if (err instanceof CommandValidationResult && err.ErrorType == CommandErrorType.UserError) {
            this.msg.info(err.Message);
        } else {
            this.msg.i18n().error('There was an error reading the templates:');
            this.msg.error(err['stack'] || err.toString());
        }
        this.exit(1);
    }

    protected exit(n?: number) {
        this.process.exit(n);
    }
}
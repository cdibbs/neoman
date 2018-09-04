import Command from 'commandpost/lib/command';
import { inject, injectable } from 'inversify';
import TYPES from '../../di/types';
import { IErrorReporter, IPath, ITemplateRunner, IUserMessager } from '../../i';
import { CommandResult, RunOptions } from '../../models';
import { ITemplateManager } from '../../template-management';
import { BaseCommand } from '../base-command';
import { COMMANDS, Commands } from '../commands';
import { ICommandValidator, INewCmdArgs, INewCmdOpts } from '../i';


@injectable()
export class NewCommand extends BaseCommand<INewCmdOpts, INewCmdArgs> {
    type: Commands = COMMANDS.NewProject;

    constructor(
        @inject(TYPES.UserMessager) protected msg: IUserMessager,
        @inject(TYPES.TemplateManager) protected tmplMgr: ITemplateManager,
        @inject(TYPES.Path) private path: IPath,
        @inject(TYPES.TemplateRunner) private trunner: ITemplateRunner,
        @inject(TYPES.ErrorReporter) private errorReporter: IErrorReporter,
        @inject(TYPES.NewCommandValidator) protected validator: ICommandValidator<INewCmdOpts, INewCmdArgs>
    ) {
        super(msg, process);
    }

    public async run(cmdDef: Command<INewCmdOpts, INewCmdArgs>, opts: INewCmdOpts, args: INewCmdArgs): Promise<CommandResult> {
        try {
            let validationResult = await this.validator.validate(cmdDef, opts, args);
            if (validationResult.IsError) {
                return validationResult;
            }
            
            let options = this.buildOptions(opts);
            this.msg.write(`Generating project ${options.name} from template ${args.templateId}...`);        
            let info = await this.tmplMgr.info(args.templateId);
            return await this.trunner.run(options.path, options, info);
        } catch (ex) {
            this.errorReporter.reportError(ex);
        }
    }

    protected buildOptions(opts: INewCmdOpts): RunOptions {
        let cwd = this.process.cwd(), cdname = cwd.split(this.path.sep).pop();
        let optsName = (opts.name || []).join(' ').trim();   
        let options = new RunOptions();
        options.name = optsName || cdname;
        options.path = (opts.path || [])[0] || cwd;
        options.verbosity = opts.verbosity || options.verbosity;
        options.showExcluded = (typeof opts.showExcluded !== "boolean") || options.showExcluded;
        options.defaults = !! opts.defaults;
        return options;
    }
}
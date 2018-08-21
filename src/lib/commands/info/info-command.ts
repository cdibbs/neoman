import { Command } from 'commandpost';
import { inject, injectable } from 'inversify';
import TYPES from '../../di/types';
import { IErrorReporter, IPath, IUserMessager } from '../../i';
import { CommandValidationResult } from '../../models';
import { ITemplateManager } from '../../template-management';
import { BaseCommand } from '../base-command';
import { Commands, COMMANDS } from '../commands';
import { ICommandValidator, IInfoCmdArgs, IInfoCmdOpts } from '../i';
import { ITemplateInfo } from './i/i-template-info';


@injectable()
export class InfoCommand extends BaseCommand<IInfoCmdOpts, IInfoCmdArgs> {
    type: Commands = COMMANDS.Info;

    constructor(
        @inject(TYPES.TemplateManager) protected tmplMgr: ITemplateManager,
        @inject(TYPES.UserMessager) protected msg: IUserMessager,
        @inject(TYPES.Process) protected process: NodeJS.Process,
        @inject(TYPES.Path) private path: IPath,
        @inject(TYPES.ErrorReporter) private reporter: IErrorReporter,
        @inject(TYPES.TemplateInfo) private tmplInfo: ITemplateInfo,
        @inject(TYPES.InfoCommandValidator) protected validator: ICommandValidator<IInfoCmdOpts, IInfoCmdArgs>
    ) {
       super(msg, process);
    }

    public async run(cmdDef: Command<IInfoCmdOpts, IInfoCmdArgs>, opts: IInfoCmdOpts, args: IInfoCmdArgs): Promise<CommandValidationResult> {
        let result = await this.validator.validate(cmdDef, opts, args);
        if (result.IsError) {
            return result;
        }
        
        await this.runWithValidArgs(opts, args);
        return new CommandValidationResult();
    }

    public async runWithValidArgs(opts: IInfoCmdOpts, args: IInfoCmdArgs): Promise<void> {
        try {            
            const tmplInfo = await this.tmplMgr.info(args.templateId);
            this.tmplInfo.showTemplateInfo(tmplInfo);
        } catch(err) {
            
            this.reporter.reportError(err);
        }
    }
}
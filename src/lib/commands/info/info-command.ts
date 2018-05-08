import { injectable, inject } from 'inversify';
import { Command } from 'commandpost';

import { Commands, COMMANDS } from '../commands';
import { BaseCommand } from '../base-command';
import { IPath, IUserMessager, ITemplateValidator, IErrorReporter } from '../../i';
import { ITemplate } from '../../i/template';
import { ITemplateInfo } from './i/i-template-info';
import { IInfoCmdArgs, IInfoCmdOpts, ICommandValidator } from '../i';
import TYPES from '../../di/types';
import { CommandValidationResult, CommandErrorType, CommandResult } from '../../models';
import { curry } from '../../util/curry';
import { ITemplateManager } from '../../template-management';

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
import { injectable, inject } from 'inversify';
import { Command } from 'commandpost';

import { Commands, COMMANDS } from '../commands';
import { BaseCommand } from '../base-command';
import { IPath, IUserMessager, ITemplateManager, ITemplateValidator, IErrorReporter } from '../../i';
import { ITemplate } from '../../i/template';
import { ITemplateInfo } from './i/i-template-info';
import { IInfoCmdArgs, IInfoCmdOpts } from '../i';
import TYPES from '../../di/types';
import { CommandValidationResult, CommandErrorType } from '../../models';
import { curry } from '../../util/curry';

@injectable()
export class InfoCommand extends BaseCommand<IInfoCmdOpts, IInfoCmdArgs> {
    type: Commands = COMMANDS.Info;

    constructor(
        @inject(TYPES.TemplateManager) protected tmplMgr: ITemplateManager,
        @inject(TYPES.UserMessager) protected msg: IUserMessager,
        @inject(TYPES.Process) protected process: NodeJS.Process,
        @inject(TYPES.Path) private path: IPath,
        @inject(TYPES.ErrorReporter) private reporter: IErrorReporter,
        @inject(TYPES.TemplateInfo) private tmplInfo: ITemplateInfo
    ) {
       super(msg, process);
    }

    public async run(cmdDef: Command<IInfoCmdOpts, IInfoCmdArgs>, opts: IInfoCmdOpts, args: IInfoCmdArgs): Promise<any> {
        let result = await this.validate(cmdDef, opts, args);
        if (result.IsError) {
            return this.reporter.reportError(result);
        }
        
        return this.runWithValidArgs(opts, args);
    }

    public async runWithValidArgs(opts: IInfoCmdOpts, args: IInfoCmdArgs): Promise<void> {
        try {
            const tmplInfo = await this.tmplMgr.info(args.templateId);
            this.tmplInfo.showTemplateInfo(tmplInfo);
        } catch(err) {
            this.reporter.reportError(err);
        }
    }

    public validate(cmd: Command<IInfoCmdOpts, IInfoCmdArgs>, opts: IInfoCmdOpts, args: IInfoCmdArgs): Promise<CommandValidationResult> {
        let promise: Promise<CommandValidationResult>;
        if (! args.templateId) {
            var v = new CommandValidationResult();
            v.Messages.push(this.msg.i18n({helptext: cmd.helpText()}).mf("You must specify a template identifier.\n\n{helptext}"));
            v.ErrorType = CommandErrorType.UserError;
            return Promise.resolve(v);
        } 

        return super.validate(cmd, opts, args);
    }
}
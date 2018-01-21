import { injectable, inject } from 'inversify';
import { Command } from 'commandpost';

import { Commands, COMMANDS } from '../commands';
import { BaseCommand } from '../base-command';
import { IPath, IUserMessager, ITemplateManager, ITemplateValidator, IErrorReporter } from '../../i';
import { ITemplate } from '../../i/template';
import { ITemplateInfo } from './i/i-template-info';
import { IInfoCmdArgs, IInfoCmdOpts } from '../i';
import TYPES from '../../di/types';
import { CommandValidationResult, CommandErrorType } from '../models';
import { curry } from '../../util/curry';

@injectable()
export class InfoCommand extends BaseCommand<IInfoCmdOpts, IInfoCmdArgs> {
    type: Commands = COMMANDS.Info;

    constructor(
        @inject(TYPES.TemplateManager) protected tmplMgr: ITemplateManager,
        @inject(TYPES.TemplateValidator) private validator: ITemplateValidator,
        @inject(TYPES.UserMessager) protected msg: IUserMessager,
        @inject(TYPES.Process) protected process: NodeJS.Process,
        @inject(TYPES.Path) private path: IPath,
        @inject(TYPES.ErrorReporter) private reporter: IErrorReporter,
        @inject(TYPES.TemplateInfo) private tmplInfo: ITemplateInfo
    ) {
       super(msg, process);
    }

    public async run(cmdDef: Command<IInfoCmdOpts, IInfoCmdArgs>, opts: IInfoCmdOpts, args: IInfoCmdArgs): Promise<any> {
        let promise = this.validate(cmdDef, opts, args)
            .then(curry.twoOf3(this.runWithValidArgs, this, opts, args))
            .catch(curry.bindOnly(this.reporter.reportError, this));

        return promise;
    }

    public runWithValidArgs(opts: IInfoCmdOpts, args: IInfoCmdArgs, validationResult: CommandValidationResult): Promise<any> {
        console.log(this.reporter);
        return this.tmplMgr.info(args.templateId)
            .then(curry.bindOnly(this.tmplInfo.showTemplateInfo, this))
            .catch(curry.bindOnly(this.reporter.reportError, this));
    }

    public validate(cmd: Command<IInfoCmdOpts, IInfoCmdArgs>, opts: IInfoCmdOpts, args: IInfoCmdArgs): Promise<CommandValidationResult> {
        console.log(this.reporter);
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
}
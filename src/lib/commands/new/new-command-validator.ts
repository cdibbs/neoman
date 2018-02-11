import { Command } from "commandpost";

import { INewCmdArgs, INewCmdOpts, ICommand, ICommandValidator } from "../i";
import { Commands } from '../commands';
import { CommandValidationResult, CommandErrorType } from '../../models';
import { BaseCommandValidator } from "../base-command-validator";

export class NewCommandValidator extends BaseCommandValidator<INewCmdOpts, INewCmdArgs> {
    async validate(cmd: Command<INewCmdOpts, INewCmdArgs>, opts: INewCmdOpts, args: INewCmdArgs): Promise<CommandValidationResult> {
        let result = await super.validate(cmd, opts, args);

        if (! args.templateId) {
            let missingTemplateId = this.msg.i18n({helptext: cmd.helpText()}).mf("You must specify a template identifier.\n\n{helptext}")
            result.Messages.push(missingTemplateId);
            result.ErrorType = CommandErrorType.UserError;
            return result;
        }
        
        return new CommandValidationResult();
    }
}
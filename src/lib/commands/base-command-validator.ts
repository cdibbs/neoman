import { inject, injectable, unmanaged } from "inversify";
import { Command } from "commandpost";

import { ICommandValidator } from "./i";
import { IUserMessager, ISettingsProvider } from "../i";
import { CommandValidationResult, CommandErrorType } from "../models";
import TYPES from '../di/types';
import { ValidatorOptions } from "./validator-options";
import KEYS from '../settings-keys';

@injectable()
export class BaseCommandValidator<TOpts, TArgs> implements ICommandValidator<TOpts, TArgs> {
    public tempDir: string = null;
    public constructor(
        @inject(TYPES.UserMessager) protected msg: IUserMessager,
        @inject(TYPES.SettingsProvider) protected settings: ISettingsProvider,
        @unmanaged() protected opts: ValidatorOptions
    ) {
        this.tempDir = this.settings.get(KEYS.tempDirKey);
    }

    public async validate(cmd: Command<TOpts, TArgs>, opts: any, args: any): Promise<CommandValidationResult>
    {
        let v = new CommandValidationResult();
        if (! this.tempDir || ! this.tempDir.trim()) {
            let missingTemplateDir = this.msg.i18n().mf("You have not set a template directory. Please run setdir, first.");
            v.Messages.push(missingTemplateDir);
            v.ErrorType = CommandErrorType.UserError;
        }

        if (this.opts.checkTmplId && (! args.templateId || ! args.templateId.trim())) {
            let missingTemplateId = this.msg
                .i18n({helptext: cmd.helpText()})
                .mf("You must specify a template identifier.\n\n{helptext}")
            v.Messages.push(missingTemplateId);
            v.ErrorType = CommandErrorType.UserError;
        }

        return v;
    }
}
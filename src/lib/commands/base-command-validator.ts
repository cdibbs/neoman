import { inject, injectable } from "inversify";
import { Command } from "commandpost";

import { ICommandValidator } from "./i";
import { IUserMessager } from "../i";
import { CommandValidationResult, CommandErrorType } from "../models";
import TYPES from '../di/types';

@injectable()
export class BaseCommandValidator<TOpts, TArgs> implements ICommandValidator<TOpts, TArgs> {
    public tempDir: string = null;
    public constructor(
        @inject(TYPES.UserMessager) protected msg: IUserMessager
    ) {}

    public async validate(cmd: Command<TOpts, TArgs>, opts: TOpts, args: TArgs): Promise<CommandValidationResult>
    {
        if (! this.tempDir || ! this.tempDir.trim()) {
            let v = new CommandValidationResult();
            let missingTemplateDir = this.msg.i18n().mf("You have not set a template directory. Please run setdir, first.");
            v.Messages.push(missingTemplateDir);
            v.ErrorType = CommandErrorType.UserError;
            return v;
        }

        return new CommandValidationResult();
    }
}
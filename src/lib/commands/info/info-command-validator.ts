import { Command } from "commandpost";
import { inject } from "inversify";

import { ICommand, ICommandValidator, IInfoCmdOpts, IInfoCmdArgs } from "../i";
import { Commands } from '../commands';
import { CommandValidationResult, CommandErrorType } from '../../models';
import { BaseCommandValidator } from "../base-command-validator";
import { IUserMessager, ISettingsProvider } from "../../i";
import TYPES from "../../di/types";

export class InfoCommandValidator extends BaseCommandValidator<IInfoCmdOpts, IInfoCmdArgs> {
    constructor(
        @inject(TYPES.UserMessager) protected msg: IUserMessager,
        @inject(TYPES.SettingsProvider) protected settings: ISettingsProvider
    ) {
        super(msg, settings, { checkTmplId: true });
    }
}
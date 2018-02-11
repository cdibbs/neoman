import { Command } from 'commandpost';
import { CommandValidationResult } from "../../models";

export interface ICommandValidator<TOpts, TArgs> {
    validate(cmd: Command<TOpts, TArgs>, opts: TOpts, args: TArgs): Promise<CommandValidationResult>;
}
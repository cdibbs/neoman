import { CommandValidationResult, CommandErrorType } from "./commands/models";
import { inject, injectable } from "inversify";
import { IUserMessager, IErrorReporter } from "./i";
import TYPES from "./di/types";

@injectable()
export class ErrorReporter implements IErrorReporter {
    public constructor(
        @inject(TYPES.UserMessager) private msg: IUserMessager
    ) {

    }

    public reportError(err: Error | CommandValidationResult | string): void {
        if (err instanceof CommandValidationResult && err.ErrorType == CommandErrorType.UserError) {
            this.msg.info(err.Message);
        } else {
            this.msg.i18n().error('There was an error reading the templates:');
            this.msg.error(err['stack'] || err.toString());
        }
    }
}
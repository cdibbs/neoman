import { CommandValidationResult } from "../commands/models";

export interface IErrorReporter {
    reportError(err: Error | CommandValidationResult | string): void;
}
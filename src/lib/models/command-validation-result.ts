import { EOL } from 'os';
import { CommandErrorType } from "./command-error-type";
import { CommandResult } from "./command-result";

export class CommandValidationResult extends CommandResult {
    public get Message(): string { return this.Messages.join(EOL); }
    public Messages: string[] = [];

    public toString(): string {
        return `${this.Message}${EOL}${this.Error}`;
    }
}
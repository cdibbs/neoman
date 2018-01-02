import { CommandErrorType } from "./command-error-type";

export class CommandValidationResult {
    public get IsError(): boolean { return this.ErrorType !== CommandErrorType.None; }
    public ErrorType: CommandErrorType = CommandErrorType.None;
    public Error: Error = null;
    public Message: string;

    public toString(): string {
        return `${this.Message}\n${this.Error}`;
    }
}
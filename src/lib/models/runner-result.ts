import { CommandResult } from "./command-result";

export class RunnerResult extends CommandResult {
    public get Message(): string {
        return `${this.totalFiles} files copied, ${this.changed} were transformed.`;
    }

    totalFiles: number = 0;
    excluded: number = 0;
    processed: number = 0;
    changed: number = 0;
    totalChanges: number = 0;
}
import { injectable } from 'inversify';
import { COMMANDS, Commands } from './commands';
import { ICommand } from './i';

@injectable()
export class BaseCommand<TOpts, TArgs> implements ICommand<TOpts, TArgs> {
    public tempDir: string = null;
    public type: Commands;

    public run(opts: TOpts, args: TArgs): void {
        throw new Error("Unimplemented in base class.");
    }
}
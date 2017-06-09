import { Commands } from '../commands';

export interface ICommand<TOpts, TArgs> {
    type: Commands;
    tempDir: string;
    run(opts: TOpts, args: TArgs): void;
}
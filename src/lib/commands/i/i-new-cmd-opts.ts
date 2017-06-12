import { Verbosity } from '../verbosity';

export interface INewCmdOpts {
    name: string[];

    defaults: boolean;
    
    force: boolean;

    verbosity: Verbosity;

    showExcluded: boolean;

    path: string;
}
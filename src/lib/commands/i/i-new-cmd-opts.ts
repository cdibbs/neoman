import { Verbosity } from '../../types/verbosity';

export interface INewCmdOpts {
    name: string[];

    defaults: boolean;
    
    force: boolean;

    verbosity: Verbosity;

    showExcluded: boolean;

    path: string;
}
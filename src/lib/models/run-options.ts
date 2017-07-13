import { Verbosity, VERBOSITY } from '../types/verbosity';

export class RunOptions {
    verbosity: Verbosity = VERBOSITY.normal;
    showExcluded: boolean = false;
    force: boolean = false;
}
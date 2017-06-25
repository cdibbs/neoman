import { IReplacementFilter } from './i-replacement-filter';
import { IWithDefinition } from './i-with-definition';

export interface IReplacementDefinition extends IReplacementFilter {
    section: IReplacementFilter;

    replace: string | IReplacementDefinition[];

    with: string | IWithDefinition;

    regex: boolean;

    regexFlags: string;

    params: any;
}
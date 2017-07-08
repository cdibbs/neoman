import { IReplacementFilter } from './i-replacement-filter';
import { IWithDefinition } from './i-with-definition';

export interface IReplacementDefinition extends IReplacementFilter {
    section?: IReplacementFilter;
    subject: string;
    with: string | IWithDefinition;
    simple?: boolean;
    regexFlags?: string;
    params?: any;
}
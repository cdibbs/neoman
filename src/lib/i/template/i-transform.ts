import { ITransformFilter } from './i-transform-filter';
import { IWithDefinition } from './i-with-definition';

export interface ITransform extends ITransformFilter {
    section?: ITransformFilter;
    subject: string;
    with: string | IWithDefinition;
    simple?: boolean;
    regexFlags?: string;
    params?: any;
}
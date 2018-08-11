import { IInputConfig } from '../../user-extensibility/i-input-config';
import { IConfigurations } from './i-configurations';
import { Transforms } from './transforms';
import { PathTransforms } from './path-transforms';

export interface ITemplate {
    __tmplPath: string;

    identity: string;
    
    name: string;

    description?: string;

    author?: string;

    classifications?: string[];

    shortName?: string;

    tags?: {
        keywords: string[];
        language: string;

        [key: string]: string | string[];
    };

    inputs?: IInputConfig;

    transform?: Transforms;

    pathTransform?: PathTransforms;

    files?: string[];

    ignore?: string[];

    configurations?: IConfigurations;

    [key: string]: any;
}
import { IInputConfig } from './i-input-config';
import { IConfigurations } from './i-configurations';
import { ReplacementsDefinition } from './replacements-definition';

export interface ITemplate {
    __tmplPath: string;

    identity: string;
    
    name: string;

    description?: string;

    author?: string;

    classifications?: string[];

    shortName?: string;

    tags?: {
        language: string;

        [key: string]: string;
    };

    inputs?: IInputConfig;

    replace?: ReplacementsDefinition;

    files?: string[];

    ignore?: string[];

    configurations?: IConfigurations;

    [key: string]: any;
}
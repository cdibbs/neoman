import { ITemplateInputs } from '../i-template-inputs';
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

    inputs?: ITemplateInputs;

    replace?: ReplacementsDefinition;

    files?: string[];

    ignore?: string[];

    configurations?: IConfigurations;

    [key: string]: any;
}
import * as it from './template';

export interface ITemplateValidator {
    dependenciesInstalled(tmpl: it.ITemplate): { [key: string]: boolean };
}
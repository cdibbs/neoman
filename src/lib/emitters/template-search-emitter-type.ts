import { ITemplate } from '../i/template';
import { ITemplateFile } from '../i';
import { TemplateManagerError } from '../template-management/template-manager-error';

export type TemplateSearchEmitterType = {
    "error": TemplateManagerError,
    "match": ITemplate,
    "end": ITemplate[]
};
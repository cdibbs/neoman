import { ITemplate } from '../i/template';
import { ITemplateFile } from '../i';

export type TemplateSearchEmitterType = {
    "error": Error,
    "match": ITemplate,
    "end": ITemplate[]
};
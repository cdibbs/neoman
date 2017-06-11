import { ITemplate } from '../i';

export type TemplateSearchEmitterType = {
    "error": Error,
    "match": ITemplate,
    "end": ITemplate[]
};
import { IEventEmitter } from '../emitters/i';
import { TemplateSearchEmitterType } from '../emitters';
import { ITemplate } from '../i/template';
import { TemplateManagerError } from './template-manager-error';

export interface ITemplateManager {
    list(
        end?: (templates: ITemplate[]) => void,
        error?: (terror: TemplateManagerError) => void,
        match?: (tmpl: ITemplate) => void
    ): IEventEmitter<TemplateSearchEmitterType>;
    
    info(tmplId: string): Promise<ITemplate>;
}
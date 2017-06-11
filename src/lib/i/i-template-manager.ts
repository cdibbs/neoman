import { IEventEmitter } from '../emitters/i';
import { TemplateSearchEmitterType } from '../emitters';
import { ITemplate } from './i-template';

export interface ITemplateManager {
    list(): IEventEmitter<TemplateSearchEmitterType>;
    info(tmplId: string): Promise<ITemplate>;
}
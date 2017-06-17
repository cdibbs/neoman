import { ITemplateFile } from '../../i';
import { IReplacementDefinition } from '../../i/template';

export interface ITransformer {
    transform(file: ITemplateFile, content: string, rdef: IReplacementDefinition): string;
}
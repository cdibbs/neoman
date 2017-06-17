import { ITransformer } from './i';
import { ITemplateFile } from '../i';
import { IReplacementDefinition } from '../i/template';

export class ReplaceRegexp implements ITransformer {
    transform(file: ITemplateFile, content: string, rdef: IReplacementDefinition): string {
        throw new Error("Method not implemented.");
    }
}
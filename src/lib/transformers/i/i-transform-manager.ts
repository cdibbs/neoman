import * as i from '../../i/template';

export interface ITransformManager {
    configure(tmpl: i.ITemplate): void;
    applyTransforms(path: string, content: string, replaceDef: i.IReplacementDefinition): string;
}
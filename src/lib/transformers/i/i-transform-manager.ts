import * as i from '../../i/template';

export interface ITransformManager {
    applyTransforms(path: string, content: string, replaceDef: i.IReplacementDefinition): string;
}
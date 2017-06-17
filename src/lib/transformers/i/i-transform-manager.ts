import * as i from '../../i/template';

export interface ITransformManager {
    applyTransforms(content: string, replaceDef: i.IReplacementDefinition): string;
}
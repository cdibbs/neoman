import * as i from '../../i/template';

export interface ITransformManager {
    configure(tmpl: i.ITemplate, inputs: { [key: string]: any }): void;
    applyTransforms(path: string, content: string, replaceDef: i.Transforms): string;
}
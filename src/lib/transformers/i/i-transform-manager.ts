import { Transforms, ITemplate } from '../../i/template';

export interface ITransformManager {
    configure(tmpl: ITemplate, inputs: { [key: string]: any }): void;
    applyTransforms(path: string, content: string, replaceDef: Transforms): Promise<string>;
}
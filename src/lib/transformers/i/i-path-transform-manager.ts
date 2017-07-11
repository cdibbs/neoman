import * as i from '../../i/template';

export interface IPathTransformManager {
    configure(tmpl: i.ITemplate, inputs: { [key: string]: any }): void;
    applyTransforms(path: string, tDefs: i.PathTransforms): string;
}
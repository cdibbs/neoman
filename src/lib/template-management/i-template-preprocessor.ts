import { ITemplate } from "../i/template";

export interface ITemplatePreprocessor {
    preprocess(tmpl: ITemplate): ITemplate;
}
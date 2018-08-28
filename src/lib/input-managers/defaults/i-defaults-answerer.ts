import { TemplateInput } from "../../user-extensibility";

export interface IDefaultsAnswerer {
    getDefault(def: TemplateInput): any;
}
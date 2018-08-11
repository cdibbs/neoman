import { ITemplateTypedInput, ITemplateScriptedInput } from "../../user-extensibility";

export interface IDefaultsAnswerer {
    getDefault(def: string | ITemplateTypedInput | ITemplateScriptedInput): any;
}
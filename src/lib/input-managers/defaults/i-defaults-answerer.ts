import { ITemplateTypedInput, ITemplateScriptedInput } from "../../i/template";

export interface IDefaultsAnswerer {
    getDefault(def: string | ITemplateTypedInput | ITemplateScriptedInput): any;
}
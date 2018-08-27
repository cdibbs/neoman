import { ITemplateComplexInput, ITemplateScriptedInput } from "../../user-extensibility";

export interface IDefaultsAnswerer {
    getDefault(def: string | ITemplateComplexInput | ITemplateScriptedInput): any;
}
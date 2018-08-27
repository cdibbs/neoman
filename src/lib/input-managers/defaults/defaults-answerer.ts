import { IDefaultsAnswerer } from "./i-defaults-answerer";
import { injectable } from "inversify";
import { ITemplateComplexInput, ITemplateScriptedInput } from "../../user-extensibility";

@injectable()
export class DefaultsAnswerer implements IDefaultsAnswerer {
    protected autoInc: number = 1;

    getDefault(def: string | ITemplateComplexInput | ITemplateScriptedInput): any {
        if ((<ITemplateComplexInput>def).default)
        {
            return (<ITemplateComplexInput>def).default;
        }

        return `NeomanAutogeneratedValue${(this.autoInc++).toFixed(3)}`;
    }
}
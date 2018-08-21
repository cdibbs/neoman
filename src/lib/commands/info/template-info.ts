import { injectable, inject } from "inversify";

import TYPES from '../../di/types';
import { ITemplateInfo } from "./i/i-template-info";
import { IUserMessager, ITemplateValidator, ITemplate } from "../../i";

@injectable()
export class TemplateInfo implements ITemplateInfo {
    public constructor(
        @inject(TYPES.TemplateValidator) private validator: ITemplateValidator,
        @inject(TYPES.UserMessager) private msg: IUserMessager
    ) {

    }

    public showTemplateInfo(tmpl: ITemplate): void {
        // FIXME i18n
        let title = `Details for template identity '${tmpl.identity}'`;
        this.msg.info(title);
        this.msg.info("=".repeat(title.length));
        this.msg.info(`Name: ${tmpl.name}`);
        this.msg.info(`Base Dir: ${tmpl.__tmplPath}`);
        this.msg.info(`Short name: ${tmpl.shortName || "[NA]"}`);
        this.msg.info(`Description: ${tmpl.description}`);
        this.msg.info(`Author: ${tmpl.author}`);
        this.msg.info(`Classifications: ${(tmpl.classifications || []).join(', ')}`);
        let deps = this.dependencies(tmpl);
        this.msg.info("Dependencies: " + deps.map((d) => !d.installed ? `${d.dep} (missing)` : d.dep).join(", "));
        this.msg.info('\n');
    }

    dependencies(tmpl: ITemplate): { dep: string, installed:  boolean }[] {
        let arr: { dep: string, installed:  boolean }[] = [];
        let deps = this.validator.dependenciesInstalled(tmpl);
        for(var key in deps) {
            arr.push({ dep: key, installed: deps[key] });
        }

        return arr;
    }
}

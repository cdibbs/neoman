import { injectable, inject } from 'inversify';
import { Commands, COMMANDS } from './commands';
import { BaseCommand } from './base-command';
import { IPath, IUserMessager, ITemplateManager, ITemplateValidator } from '../i';
import { ITemplate } from '../i/template';
import { IInfoCmdArgs, IInfoCmdOpts } from './i';
import TYPES from '../di/types';

@injectable()
export class InfoCommand extends BaseCommand<IInfoCmdOpts, IInfoCmdArgs> {
    type: Commands = COMMANDS.Info;

    constructor(
        @inject(TYPES.TemplateManager) protected tmplMgr: ITemplateManager,
        @inject(TYPES.TemplateValidator) private validator: ITemplateValidator,
        @inject(TYPES.UserMessager) protected msg: IUserMessager,
        @inject(TYPES.Process) protected process: NodeJS.Process,
        @inject(TYPES.Path) private path: IPath
    ) {
       super(msg, process); 
    }

    run(opts: IInfoCmdOpts, args: IInfoCmdArgs): void {
        super.run(opts, args);

        this.tmplMgr.info(args.tmplId)
            .then((tmpl: ITemplate) => {
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
            })
            .catch(err => {
                this.msg.error('There was an error reading the templates:');
                this.msg.error(err);
            });
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
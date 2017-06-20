import { injectable, inject } from 'inversify';
import { Commands, COMMANDS } from './commands';
import { BaseCommand } from './base-command';
import { IPath, IUserMessager, ITemplateManager } from '../i';
import { ITemplate } from '../i/template';
import { IInfoCmdArgs, IInfoCmdOpts } from './i';
import TYPES from '../di/types';

@injectable()
export class InfoCommand extends BaseCommand<IInfoCmdOpts, IInfoCmdArgs> {
    type: Commands = COMMANDS.Info;

    constructor(
        @inject(TYPES.TemplateManager) protected tmplMgr: ITemplateManager,
        @inject(TYPES.UserMessager) protected msg: IUserMessager,
        @inject(TYPES.Process) protected process: NodeJS.Process,
        @inject(TYPES.Path) private path: IPath
    ) {
       super(msg, process); 
    }

    run(opts: IInfoCmdOpts, args: IInfoCmdArgs): void {
        super.run(opts, args);

        this.tmplMgr.info(args.tmplId).then((tmpl: ITemplate) => {
            let title = `Details for template identity '${tmpl.identity}'`;
            this.msg.info(title);
            this.msg.info("=".repeat(title.length));
            this.msg.info(`Name: ${tmpl.name}`);
            this.msg.info(`Base Dir: ${tmpl.__tmplPath}`);
            this.msg.info(`Short name: ${tmpl.shortName || "[NA]"}`);
            this.msg.info(`Description: ${tmpl.description}`);
            this.msg.info(`Author: ${tmpl.author}`);
            this.msg.info(`Classifications: ${(tmpl.classifications || []).join(', ')}`);
            this.msg.info('\n');
        });
    }
}
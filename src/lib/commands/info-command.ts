import { injectable, inject } from 'inversify';
import { Commands, COMMANDS } from './commands';
import { BaseCommand } from './base-command';
import { IPath, IUserMessager, ITemplateManager, ITemplate } from '../i';
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

        this.tmplMgr.info(args.tmplId).then(tmpl => {
            let title = `Details for template identity '${tmpl.identity}'`;
            this.msg.log(title);
            this.msg.log("=".repeat(title.length));
            this.msg.log(`Name: ${tmpl.name}`);
            this.msg.log(`Short name: ${tmpl.shortName || "[NA]"}`);
            this.msg.log(`Description: ${tmpl.description}`);
            this.msg.log(`Author: ${tmpl.author}`);
            this.msg.log(`Classifications: ${(tmpl.classifications || []).join(', ')}`);
            this.msg.log();
        });
    }
}
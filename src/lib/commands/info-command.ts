import { injectable, inject } from 'inversify';
import Command from 'commandpost/lib/command';

import { Commands, COMMANDS } from './commands';
import { BaseCommand } from './base-command';
import { IPath, IUserMessager, ITemplateManager, ITemplateValidator } from '../i';
import { ITemplate } from '../i/template';
import { IInfoCmdArgs, IInfoCmdOpts } from './i';
import TYPES from '../di/types';
import { CommandValidationResult, CommandErrorType } from './models';
import { curry } from '../util/curry';

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

    public async run(cmdDef: Command<IInfoCmdOpts, IInfoCmdArgs>, opts: IInfoCmdOpts, args: IInfoCmdArgs): Promise<any> {
        let promise = this.validate(cmdDef, opts, args)
            .then(curry.twoOf3(this.runWithValidArgs, this, opts, args))
            .catch(curry.bindOnly(this.reportError, this));

        return promise;
    }

    public runWithValidArgs(opts: IInfoCmdOpts, args: IInfoCmdArgs, validationResult: CommandValidationResult): Promise<any> {
        return this.tmplMgr.info(args.templateId)
            .then(this.showTemplateInfo.bind(this))
            .catch(this.reportError.bind(this));
    }

    public validate(cmd: Command<IInfoCmdOpts, IInfoCmdArgs>, opts: IInfoCmdOpts, args: IInfoCmdArgs): Promise<CommandValidationResult> {
        let promise: Promise<CommandValidationResult>;
        if (! args.templateId) {
            var v = new CommandValidationResult();
            v.Message = this.msg.i18n({helptext: cmd.helpText()}).mf("You must specify a template identifier.\n\n{helptext}");
            v.ErrorType = CommandErrorType.UserError;
            promise = Promise.reject(v);
        } else {
            promise = Promise.resolve(new CommandValidationResult());
        }

        return promise.then(curry.threeOf4(super.validate, this, cmd, opts, args));
    }

    public showTemplateInfo(tmpl: ITemplate) {
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

    reportError(err: Error | CommandValidationResult): void {
        if (err instanceof CommandValidationResult && err.ErrorType == CommandErrorType.UserError) {
            this.msg.info(err.Message);
        } else {
            this.msg.i18n().error('There was an error reading the templates:');
            this.msg.error(err['stack'] || err.toString());
        }
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
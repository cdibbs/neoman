import Command from 'commandpost/lib/command';
import { inject, injectable } from 'inversify';
import TYPES from '../../di/types';
import { IFileSystem, IPath, ITemplate, IUserMessager } from '../../i';
import { CommandValidationResult } from '../../models';
import { ITemplateManager } from '../../template-management';
import { TemplateManagerError } from '../../template-management/template-manager-error';
import { curry } from '../../util/curry';
import { BaseCommand } from '../base-command';
import { COMMANDS, Commands } from '../commands';
import { ICommandValidator } from '../i';


@injectable()
export class ListCommand extends BaseCommand<any, any> {
    type: Commands = COMMANDS.ListTemplates;
    neomanPath: string = "*/.neoman.config/template.json";

    constructor(
        @inject(TYPES.UserMessager) protected msg: IUserMessager,
        @inject(TYPES.Process) protected process: NodeJS.Process,
        @inject(TYPES.FS) private fs: IFileSystem,
        @inject(TYPES.Path) private path: IPath,
        @inject(TYPES.ListCommandValidator) protected validator: ICommandValidator<any, any>,
        @inject(TYPES.TemplateManager) protected tmplManager: ITemplateManager
    ) {
        super(msg, process);
    }

    public async run(cmdDef: Command<any, any>, opts: any, args: any): Promise<CommandValidationResult> {
        let resolve: (value?: any | PromiseLike<any>) => void;
        let reject: (reason: any) => void;
        const listerPromise = new Promise<CommandValidationResult>((res, rej) => {
            resolve = res;
            reject = rej;
        });
        const validationResult = await this.validator.validate(cmdDef, opts, args);
        if (validationResult.IsError) {
            resolve(validationResult);
            return listerPromise;
        }

        this.msg.i18n({tempDir: this.tempDir})
            .info("Listing templates in your template directory.")
            .info("Using: {tempDir}\n"); 
        this.tmplManager.list(
            curry.oneOf2(this.end, this, resolve),
            curry.oneOf2(this.error, this, reject),
            curry.bindOnly(this.match, this)
        );

        return listerPromise;
    }

    match(tmpl: ITemplate): void {
        this.msg.i18n({id: tmpl.identity, name: tmpl.name}).info('\t{id} - {name}');
    }

    error(reject: (reason: any) => void, terr: TemplateManagerError): void {
        this.msg.i18n({file: terr.file}).error('Error reading template definition file: {file}.');
        this.msg.error(terr.error);
        reject(terr);
    }

    end(
        resolve: (value?: any | PromiseLike<any>) => void,
        allFiles: ITemplate[]
    ): void {
        let qty = (allFiles || []).length;
        this.msg.i18n({num: qty}).info(`\n{num} template(s) found.\n`);
        resolve(new CommandValidationResult());
    }
}
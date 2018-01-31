import { injectable, inject } from 'inversify';

import { COMMANDS, Commands } from '../commands';
import { BaseCommand } from '../base-command';
import TYPES from '../../di/types';
import { IFileSystem, IGlob, IPath, IUserMessager } from '../../i';
import Command from 'commandpost/lib/command';
import { CommandValidationResult } from '../models';
import { curry } from '../../util/curry';
import { IGlobFactory } from '../../util/i-glob-factory';

@injectable()
export class ListCommand extends BaseCommand<any, any> {
    type: Commands = COMMANDS.ListTemplates;
    neomanPath: string = "*/.neoman.config/template.json";
    resolve: (value?: any | PromiseLike<any>) => void;

    constructor(
        @inject(TYPES.UserMessager) protected msg: IUserMessager,
        @inject(TYPES.Process) protected process: NodeJS.Process,
        @inject(TYPES.FS) private fs: IFileSystem,
        @inject(TYPES.Path) private path: IPath,
        @inject(TYPES.GlobFactory) private globFactory: IGlobFactory
    ) {
        super(msg, process);
    }

    public async run(cmdDef: Command<any, any>, opts: any, args: any): Promise<any> {
        let validationResult = await this.validate(cmdDef, opts, args);
        if (validationResult.IsError) {
            return validationResult;
        }

        return this.runValidated(opts, args);
    }

    public async runValidated(opts: any, args: any): Promise<any> {       
        let listerPromise = new Promise((resolve, reject) => {
            this.resolve = resolve;
        });

        this.msg.i18n({tempDir: this.tempDir})
            .info("Listing templates in your template directory.")
            .info("Using: {tempDir}\n");

        let g = this.globFactory.build(this.neomanPath, { cwd: this.tempDir });
        g.on("match", curry.bindOnly(this.match, this));
        g.on("end", curry.bindOnly(this.end, this));
        return listerPromise;
    }

    public validate(cmd: Command<any, any>, opts: any, args: any): Promise<CommandValidationResult> {
        return Promise.resolve(new CommandValidationResult());
    }

    match(file: string): any {
        try {
            let fullPath = this.path.join(this.tempDir, file);
            let tmpl = JSON.parse(this.fs.readFileSync(fullPath, 'utf8'));
            this.msg.i18n({id: tmpl.identity, name: tmpl.name}).info('\t{id} - {name}');
        } catch (ex) {
            this.msg.i18n({file}).error('Error reading template definition file: {file}.');
            this.msg.error(ex.stack);
            this.process.exit(1);
        }
    }

    end(allFiles: string[]): any {
        let qty = (allFiles || []).length;
        this.msg.i18n({num: qty}).info(`\n{num} template(s) found.\n`);
        this.resolve(qty);
    }
}
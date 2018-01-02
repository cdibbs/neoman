import { injectable, inject } from 'inversify';

import { COMMANDS, Commands } from './commands';
import { BaseCommand } from './base-command';
import TYPES from '../di/types';
import { IFileSystem, IGlob, IPath, IUserMessager } from '../i';
import Command from 'commandpost/lib/command';
import { CommandValidationResult } from './models';
import { curry } from '../util/curry';

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
        @inject(TYPES.Glob) private glob: IGlob
    ) {
        super(msg, process);
    }

    run(cmdDef: Command<any, any>, opts: any, args: any): Promise<any> {
        return this.validate(cmdDef, opts, args)
            .then(curry.twoOf3(this.runWithValidation, this, opts, args));
    }

    public async runWithValidation(opts: any, args: any, validationResult: CommandValidationResult): Promise<any> {
        if (validationResult.IsError) {
            return validationResult;
        }
        
        let listerPromise = new Promise((resolve, reject) => {
            this.resolve = resolve;
        });

        this.msg.i18n({tempDir: this.tempDir})
            .info("Listing templates in your template directory.")
            .info("Using: {tempDir}\n");

        let g = new this.glob.Glob(this.neomanPath, { cwd: this.tempDir });
        g.on("match", this.bind(this.match));
        g.on("end", this.bind(this.end));
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

    bind<T extends (...args: any[]) => any>(fn: T): T {
        return fn.bind(this);
    }
}
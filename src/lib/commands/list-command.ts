import { injectable, inject } from 'inversify';

import { COMMANDS, Commands } from './commands';
import { BaseCommand } from './base-command';
import TYPES from '../di/types';
import { IFileSystem, IGlob, IPath, IUserMessager } from '../i';

@injectable()
export class ListCommand extends BaseCommand<any, any> {
    type: Commands = COMMANDS.ListTemplates;
    neomanPath: string = "*/.neoman.config/template.json";

    constructor(
        @inject(TYPES.UserMessager) protected msg: IUserMessager,
        @inject(TYPES.Process) protected process: NodeJS.Process,
        @inject(TYPES.FS) private fs: IFileSystem,
        @inject(TYPES.Path) private path: IPath,
        @inject(TYPES.Glob) private glob: IGlob
    ) {
        super(msg, process);
    }

    run(opts: any, args: any): void {
        super.run(opts, args);

        this.msg.i18n({tempDir: this.tempDir})
            .info("Listing templates in your template directory.")
            .info("Using: {tempDir}\n");

        let g = new this.glob.Glob(this.neomanPath, { cwd: this.tempDir });
        g.on("match", this.bind(this.match));
        g.on("end", this.bind(this.end));
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
        this.msg.i18n({num: (allFiles || []).length}).info(`\n{num} template(s) found.\n`);
    }

    bind<T extends (...args: any[]) => any>(fn: T): T {
        return fn.bind(this);
    }
}
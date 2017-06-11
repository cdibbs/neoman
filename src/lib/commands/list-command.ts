import { injectable, inject } from 'inversify';

import { COMMANDS, Commands } from './commands';
import { BaseCommand } from './base-command';
import TYPES from '../di/types';
import { IFileSystem, IGlob, IPath, IUserMessager } from '../i';

@injectable()
export class ListCommand extends BaseCommand<any, any> {
    type: Commands = COMMANDS.ListTemplates;

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

        this.msg.log("Listing templates in your template directory.");
        this.msg.log(`Using: ${this.tempDir}\n`);

        let g = new this.glob.Glob("*/.template.config/template.json", { cwd: this.tempDir });
        g.on("match", this.match.bind(this));
        g.on("end", this.end.bind(this));
    }

    match(file: string): any {
            let fullPath = this.path.join(this.tempDir, file);
            try {
                let tmpl = JSON.parse(this.fs.readFileSync(fullPath, 'utf8'));
                this.msg.log(`\t${tmpl.identity} - ${tmpl.name}`);
            } catch (ex) {
                this.msg.error(`Error reading template definition file: ${file}.`);
                throw ex;
            }
    }

    end(allFiles: string[]): any {
        this.msg.log(`\n${allFiles.length} template(s) found.\n`);
    }
}
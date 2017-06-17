import { injectable, inject } from 'inversify';

import { EventEmitter, TemplateSearchEmitterType } from './emitters';
import { COMMANDS, Commands } from './commands';
import TYPES from './di/types';
import KEYS from './settings-keys';
import { IFileSystem, IGlob, IPath, IUserMessager, ITemplateManager, ISettingsProvider } from './i';
import { ITemplate } from './i/template';

@injectable()
export class TemplateManager implements ITemplateManager {
    private tmplDir: string;

    constructor(
        @inject(TYPES.SettingsProvider) protected settings: ISettingsProvider,
        @inject(TYPES.UserMessager) protected msg: IUserMessager,
        @inject(TYPES.FS) private fs: IFileSystem,
        @inject(TYPES.Path) private path: IPath,
        @inject(TYPES.Glob) private glob: IGlob
    ) {
        this.tmplDir = this.settings.get(KEYS.tempDirKey);
    }

    list(): EventEmitter<TemplateSearchEmitterType> {
        let templates: ITemplate[] = [];
        let emitter = new EventEmitter<TemplateSearchEmitterType>();
        emitter.on("match", (tmpl: ITemplate) => { templates.push(tmpl); });
        let g = new this.glob.Glob("*/.template.config/template.json", { cwd: this.tmplDir });
        g.on("match", (() => { return (file: string) => this.templateMatch.bind(this)(file, emitter); })());
        g.on("end", () => emitter.emit('end', templates));
        return emitter;
        //this.msg.log("Listing templates in your template directory.");
        //this.msg.log(`Using: ${this.tmplDir}\n`);
    }

    info(tmplId: string): Promise<ITemplate> {
        return new Promise((resolve, reject) => {
            this.list().on('end', (list: ITemplate[]) => {
                resolve(list.find(tmpl => tmpl.identity === tmplId));
            });
            this.list().on('error', (ex: Error) => reject(ex));
        });
    }

    private templateMatch(file: string, emitter: EventEmitter<TemplateSearchEmitterType>): any {
            let fullPath = this.path.join(this.tmplDir, file);
            try {
                let tmpl = JSON.parse(this.fs.readFileSync(fullPath, 'utf8'));
                tmpl.__tmplPath = this.path.join(this.path.dirname(fullPath), '..');
                emitter.emit("match", tmpl);
                //this.msg.log(`\t${tmpl.identity} - ${tmpl.name}`);
            } catch (ex) {
                emitter.emit("error", ex);
                //this.msg.error(`Error reading template definition file: ${file}.`);
                //throw ex;
            }
    }
}
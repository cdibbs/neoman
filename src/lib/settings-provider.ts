import { injectable, inject } from 'inversify';
import { ISettingsProvider, IPath, IFileSystem } from './i';
import TYPES from './di/types';
import { MapperService } from 'simple-mapper';

/**
 * Just a wrapper around the user-settings module, for now.
 */
@injectable()
export class SettingsProvider<T> implements ISettingsProvider {
    private filename: string = ".neoman-settings";
    private filepath: string;
    private mapper: MapperService;

    constructor(
        @inject(TYPES.SettingsType) private TSettings: { new (): T },
        @inject(TYPES.Process) private process: NodeJS.Process,
        @inject(TYPES.FS) private fs: IFileSystem,
        @inject(TYPES.Path) private path: IPath
    ) {
        this.mapper = new MapperService();
        var homedir = process.env.HOME || process.env.USERPROFILE;
        this.filepath = path.join(homedir, this.filename);
    }

    get(key: string): T {
        var settings = this.readSettings();
        return settings[key];
    }

    set(key: string, value: any): void {
        var settings = this.readSettings();
        settings[key] = value;
        this.fs.writeFileSync(this.filepath, JSON.stringify(settings, null, 2));
    }

    readSettings(): T {
        let raw = this.readFileJSON(this.filepath);
        let mapped = this.mapper.map<T>(this.TSettings, raw);
        return mapped;
    }

    readFileJSON(filepath: string): any {
        var rawData = '{}';
        try {
            rawData = this.fs.readFileSync(filepath, "ascii");
        } catch (err) {
            if (err.code === 'ENOENT') {
                this.fs.writeFileSync(filepath, rawData);
            } else {
                throw err;
            }
        }

        try {
            var options = JSON.parse(rawData);
        } catch (err) {
            err.filepath = filepath;
            throw err;
        }

        return options;
    }
}
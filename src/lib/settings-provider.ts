import { injectable } from 'inversify';
let userSettings = require('user-settings');
import { ISettingsProvider } from './i';

/**
 * Just a wrapper around the user-settings module, for now.
 */
@injectable()
export class SettingsProvider implements ISettingsProvider {
    private filename: string = ".neoman-settings";
    private settings: any;

    static userSettings = userSettings;

    constructor() {
        this.settings = SettingsProvider.userSettings.file(this.filename);
    }

    get(key: string): string {
        return this.settings.get(key);
    }

    set(key: string, value: string): void {
        this.settings.set(key, value);
    }
}
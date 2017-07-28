import * as i from '../lib/i';

export let mockMessagerFactory = () => <i.IUserMessager> {
    info: (message: any, indent?: number): void => {},
    debug: (message: any, indent?: number): void => {},
    warn: (message: any, indent?: number): void => {},
    error: (message: any, indent?: number): void => {},
    write: (message: string, indent: number = 0, level: i.Levels = i.LEVELS.Debug): void => {}
};
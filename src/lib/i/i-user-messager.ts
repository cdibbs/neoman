export interface IUserMessager {
    log(message?: string, ...args: string[]): void;
    debug(message?: string, ...args: string[]): void;
    warn(message?: string, ...args: string[]): void;
    error(message?: string, ...args: string[]): void;
}
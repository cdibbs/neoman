export interface IUserMessager {
    log(message?: any, ...args: any[]): void;
    debug(message?: any, ...args: any[]): void;
    warn(message?: any, ...args: any[]): void;
    error(message?: any, ...args: any[]): void;
}
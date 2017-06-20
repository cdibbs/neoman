import { UnionKeyToValue } from '../union-key-to-value';

export interface IConsole {
    log(message?: any, ...args: any[]): void;
    debug(message?: any, ...args: any[]): void;
    warn(message?: any, ...args: any[]): void;
    error(message?: any, ...args: any[]): void;
}

export type Levels = "Debug" | "Info" | "Warn" | "Error";
export const LEVELS: UnionKeyToValue<Levels> = {
    Debug: "Debug",
    Info: "Info",
    Warn: "Warn",
    Error: "Error"
}

export interface IUserMessager {
    debug(message: any, indent?: number): void
    info(message: any, indent?: number): void
    warn(message: any, indent?: number): void
    error(message: any, indent?: number): void;
    write(message: string, indent?: number, level?: Levels): void;
}
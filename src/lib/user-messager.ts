import { injectable } from 'inversify';
import { IUserMessager, Levels, LEVELS } from './i';

@injectable()
export class UserMessager implements IUserMessager {
    info(message: any, indent?: number): void {
        this.write(message, indent, LEVELS.Info);
    }

    debug(message: any, indent?: number): void {
        this.write(message, indent, LEVELS.Debug);
    }

    warn(message: any, indent?: number): void {
        this.write(message, indent, LEVELS.Warn);
    }

    error(message: any, indent?: number): void {
        this.write(message, indent, LEVELS.Error);
    }

    write(message: string, indent: number = 0, level: Levels = LEVELS.Debug): void {
        let space = "  ".repeat(indent);
        let msg = `${space}${message}`;
        switch (level) {
            case LEVELS.Debug: console.log(msg); break;
            case LEVELS.Info: console.log(msg); break;
            case LEVELS.Warn: console.warn(msg); break;
            case LEVELS.Error: console.error(msg); break;
            default:
                throw new Error(`Write not implemented for level ${level}.`);
        }
    }
}
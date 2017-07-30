import { inject, injectable } from 'inversify';

import { IUserMessager, Levels, LEVELS, Ii18nFunction } from './i';
import TYPES from './di/types';

@injectable()
export class UserMessager implements IUserMessager {
    constructor(
        @inject(TYPES.i18n) public __mf: Ii18nFunction,
        private mfDict: any = null,
        private usei18n: boolean = false
    ) {}

    info(message: any, indent?: number): IUserMessager {
        this.write(message, indent, LEVELS.Info);
        return this;
    }

    debug(message: any, indent?: number): IUserMessager {
        this.write(message, indent, LEVELS.Debug);
        return this;
    }

    warn(message: any, indent?: number): IUserMessager {
        this.write(message, indent, LEVELS.Warn);
        return this;
    }

    error(message: any, indent?: number): IUserMessager {
        this.write(message, indent, LEVELS.Error);
        return this;
    }

    write(message: string, indent: number = 0, level: Levels = LEVELS.Debug): IUserMessager {
        let space = "  ".repeat(indent);
        let msg = `${space}${message}`;
        if (this.usei18n) {
            msg = this.__mf(msg, this.mfDict);
        }
        switch (level) {
            case LEVELS.Debug: console.log(msg); break;
            case LEVELS.Info: console.log(msg); break;
            case LEVELS.Warn: console.warn(msg); break;
            case LEVELS.Error: console.error(msg); break;
            default:
                throw new Error(this.__mf('Write not implemented for level {level}.', { level: level }));
        }

        return this;
    }

    /**
     * Enable i18n + MessageFormat dictionary for subsequent method calls.
     * Example: this.msg.i18n(myKeyVals).debug("a {key} message")
     * @param mfDict Dictionary to use for i18n
     */
    i18n(mfDict?: any): IUserMessager {
        return new UserMessager(this.__mf, mfDict, true);
    }
}
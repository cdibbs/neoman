import { inject, injectable } from 'inversify';
import TYPES from '../../di/types';
import { IUserMessager } from '../../i';
import { RunOptions } from '../../models';
import { BaseInputManager } from '../base-input-manager';
import { IDuplexer } from './i-duplexer';
import { IInputConfig } from '../../user-extensibility';

@injectable()
export class BrowserInputManager extends BaseInputManager {
    constructor(
        @inject(TYPES.UserMessager) protected msg: IUserMessager,
        @inject(TYPES.BrowserClientDuplexer) protected duplexer: IDuplexer
    ) {
        super();
    }

    async ask(config: IInputConfig, options: RunOptions): Promise<{ [key: string]: any }> {
        try {
            this.msg.write("Launching browser... please answer template questions and close.");
            return await this.duplexer.getAnswers(config);
        } finally {
            this.duplexer.stop();
        }
    }
}
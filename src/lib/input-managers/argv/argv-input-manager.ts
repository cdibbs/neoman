import { inject, injectable } from 'inversify';
import TYPES from '../../di/types';
import { RunOptions } from '../../models';
import { IInputConfig } from '../../user-extensibility';
import { BaseInputManager } from '../base-input-manager';
var NestedError = require('nested-error-stacks');

@injectable()
export class ArgvInputManager extends BaseInputManager {

    constructor(
        
    ) {
        super();
    }

    async ask(config: IInputConfig, options: RunOptions): Promise<{ [key: string]: any }> {
        let dict = {};
        if (!config.define)
        {
            return dict;
        }

        for(let key in config.define) {
            //dict[key] = this.answerer.getDefault(config.define[key]);
        }

        return dict;
    }
}
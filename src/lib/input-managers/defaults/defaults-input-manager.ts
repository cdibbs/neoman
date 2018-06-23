import { injectable, inject } from 'inversify';
var NestedError = require('nested-error-stacks');

import { BaseInputManager } from '../base-input-manager';
import TYPES from '../../di/types';
import { RunOptions} from '../../models';
import { IInputConfig } from '../../i/template';
import { IDefaultsAnswerer } from './i-defaults-answerer';

@injectable()
export class DefaultsInputManager extends BaseInputManager {
    autoInc: number = 1;

    constructor(
        @inject(TYPES.DefaultsAnswerer) protected answerer: IDefaultsAnswerer
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
            dict[key] = this.answerer.getDefault(config.define[key]);
        }

        return dict;
    }
}
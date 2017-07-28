import { injectable, inject } from 'inversify';

import TYPES from '../di/types';
import * as i from '../i';
import * as it from '../i/template';

export abstract class BaseInputManager implements i.IInputManager {
    protected tmplRootPath: string;

    configure(tmplRootPath: string) {
        this.tmplRootPath = tmplRootPath;
    }

    abstract ask(config: it.IInputConfig): Promise<{ [key: string]: any }>;
}
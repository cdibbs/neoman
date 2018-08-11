import { injectable, inject } from 'inversify';
import * as i from '../i';
import { RunOptions } from '../models';
import { IInputConfig } from '../user-extensibility';

@injectable()
export abstract class BaseInputManager implements i.IInputManager {
    protected tmplRootPath: string;

    configure(tmplRootPath: string) {
        this.tmplRootPath = tmplRootPath;
    }

    abstract ask(config: IInputConfig, options: RunOptions): Promise<{ [key: string]: any }>;
}
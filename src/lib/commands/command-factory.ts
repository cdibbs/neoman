import { injectable, multiInject } from 'inversify';
import { Commands, COMMANDS } from './commands';
import { ICommandFactory, ICommand } from './i';
import TYPES from '../di/types';

@injectable()
export class CommandFactory implements ICommandFactory {
    private cmdDict: { [key: string]: ICommand<any, any> };

    constructor(
        @multiInject(TYPES.Commands) private commands: ICommand<any, any>[]
    ) {
        this.cmdDict = this.commands.reduce((p, c) => { p[c.type] = c; return p; }, {});
    }

    build(type: Commands, tempDir: string): ICommand<any, any> {
        if (this.cmdDict.hasOwnProperty(type)) {
            let c = this.cmdDict[type];
            c.tempDir = tempDir;
            return c;
        }

        throw new Error(`Command not implemented: ${type}.`);
    }
}
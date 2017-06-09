import { injectable } from 'inversify';
import { IGlobber } from './i';
import * as glob from 'glob';
import TYPES from './di/types';

@injectable()
export class Globber implements IGlobber {
    globble(expr: string): void {
        let g = new glob.Glob(expr);
        //g.on('match', this.match.bind(this));
    }


}
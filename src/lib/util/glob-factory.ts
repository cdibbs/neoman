import * as glob from 'glob';
import { IGlobFactory } from './i-glob-factory';

export class GlobFactory implements IGlobFactory {
    public build(pattern: string, options: glob.IOptions): glob.IGlob {
        return new glob.Glob(pattern, options);
    }
}
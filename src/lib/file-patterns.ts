import { injectable, inject } from 'inversify';

import * as minimatch from 'minimatch';
import * as i from './i';

@injectable()
export class FilePatterns implements i.IFilePatterns {
    match(path: string, patterns: string[]): string[] {
        return patterns.reduce((p, cpattern) => {
            if (minimatch(path, cpattern)) {
                p.push(cpattern);
            }
            return p;
        }, []);
    }
}
/// <reference path="../../../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../../../node_modules/@types/chai/index.d.ts" />
import "reflect-metadata";
import { expect } from 'chai';

import { TransformManager } from './transform-manager';
import * as i from '../i';

describe('TransformManager', () => {
    var tm: TransformManager;

    beforeEach(() => {
        let filePatterns: i.IFilePatterns = {
            match(path: string, patterns: string[]): string[] {
                return [];
            }
        };
        let userMessager: i.IUserMessager = {
            info: (message: any, indent?: number): void => {},
            debug: (message: any, indent?: number): void => {},
            warn: (message: any, indent?: number): void => {},
            error: (message: any, indent?: number): void => {},
            write: (message: string, indent: number = 0, level: i.Levels = i.LEVELS.Debug): void => {}
        };
        tm = new TransformManager(filePatterns, userMessager);
    })

    describe('#preprocess', () => {
        it('should substitute an unescaped variable', () => {
            tm['inputs'] = { "hello": "world" };
            let result = tm.preprocess("I just wanted to say {{hello}}.");
            expect(result).to.equal("I just wanted to say world.");
        });

        it('should substitute many variables', () => {
            tm['inputs'] = { "hello": "world", "another": "also" };
            let result = tm.preprocess("I just wanted to say {{hello}} {{another}}.");
            expect(result).to.equal("I just wanted to say world also.");
        });

        it('should not substitute a variable that does not exist.', () => {
            tm['inputs'] = { "hello": "world", "another": "also" };
            let result = tm.preprocess("I just wanted to say {{missing}}.");
            expect(result).to.equal("I just wanted to say {{missing}}.");
        });

        it('should ignore bracket mismatches.', () => {
            tm['inputs'] = { "hello": "world" };
            let result = tm.preprocess("I just wanted to say {{hello.");
            expect(result).to.equal("I just wanted to say {{hello.");
            result = tm.preprocess("I just wanted to say hello}}.");
            expect(result).to.equal("I just wanted to say hello}}.");
        });

        it('should ignore escaped curly brackets.', () => {
            // Wrapping the starting {{ in "{{" and "}}" is a special case which will result in escaping the input reference.
            // An alternative is to put { "hello" : "{{hello}}" } in your inputConfig.baseInputs.
            tm['inputs'] = { "hello": "world", "another": "also" };
            let result = tm.preprocess("I just wanted to say {{{{}}hello}} {{another}}.");
            expect(result).to.equal("I just wanted to say {{hello}} also.");
        });
    });
});
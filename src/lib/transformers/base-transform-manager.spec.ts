/// <reference path="../../../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../../../node_modules/@types/chai/index.d.ts" />
import "reflect-metadata";
import { expect, assert } from 'chai';
import 'mocha';

import { mockMessagerFactory } from '../../spec-lib'
import { BaseTransformManager } from './base-transform-manager';
import * as i from '../i';

describe('BaseTransformManager', () => {
    var tm: BaseTransformManager;

    beforeEach(() => {
        let filePatterns: i.IFilePatterns = {
            match(path: string, patterns: string[]): string[] {
                return [];
            }
        };
        tm = new BaseTransformManager(filePatterns, mockMessagerFactory());
    })

    describe('#preparePlugins', () => {
        it('should yield empty plugins from empty configs def', () => {
            tm['preparePlugins'](undefined);

            expect(tm["configs"]).to.deep.equal({});
        });

        it('should add key as entry and load plugin', () => {
            tm["requireg"] = () => {
                return function() {
                    this.configure = () => {

                    }
                }
            };
            tm['preparePlugins'](<any>{ one: { plugin: "myplug" } });
            expect(tm["configs"]).to.have.property("one");
        });
    });

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
            // An alternative is to put { "hello" : "{{hello}}" } in your input.baseInputs.
            tm['inputs'] = { "hello": "world", "another": "also" };
            let result = tm.preprocess("I just wanted to say {{{{}}hello}} {{another}}.");
            expect(result).to.equal("I just wanted to say {{hello}} also.");
        });
    });

    describe('#chooseReplaceEngine', () => {
        // Rationale: configuration should be able to override built-ins.
        it('should allow overriding simple replacer', () => {
            tm["configs"] = { "simple": <any>{} };
            let result = tm.chooseReplaceEngine(<any>{ using: "simple" });
            expect(result).to.equal("plugin");
        });
        it('should use default simple replacer when no user-provided plugin', () => {
            tm["configs"] = { };
            let result = tm.chooseReplaceEngine(<any>{ using: "simple" });
            expect(result).to.equal("simple");
        });
        it('should allow overriding regex replacer', () => {
            tm["configs"] = { "regex": <any>{} };
            let result = tm.chooseReplaceEngine(<any>{ using: "regex" });
            expect(result).to.equal("plugin");
        });
        it('should use default regexp replacer when no user-provided plugin', () => {
            tm["configs"] = { };
            let result = tm.chooseReplaceEngine(<any>{ using: "regex" });
            expect(result).to.equal("regex");
        });
        it('should default to plugin when not an internal name', () => {
            let result = tm.chooseReplaceEngine(<any>{ using: "coconuts" });
            expect(result).to.equal("plugin");
        });
        it('should throw a meaningful error on a malformed transform definition', () => {
            assert.throws(() => tm.chooseReplaceEngine(<any>null), "Malformed transform definition.");
        });
    });
});
/// <reference path="../../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../../node_modules/@types/chai/index.d.ts" />
import "reflect-metadata";
import * as chai from 'chai';
let expect = chai.expect, assert = chai.assert;

import { FilePatterns } from './file-patterns';

describe('FilePatterns', () => {
    var fp = new FilePatterns();

    describe('#match', () => {
        it('should return empty list on empty list', () => {
            let results = fp.match("/my/path", []);
            expect(results).to.deep.equal([]);
        });

        it('should return a match when matched', () => {
            let results = fp.match("/my/path", [ "**/path" ]);
            expect(results).to.deep.equal(["**/path"]);
        });

        it('should return a filtered list of matching globs', () => {
            let results = fp.match("/my/path", [ "**/path", "**/my/*", "nope", "**/*" ]);
            expect(results).to.deep.equal(["**/path", "**/my/*", "**/*"]);
        });
    });
});
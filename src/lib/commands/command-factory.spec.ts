/// <reference path="../../../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../../../node_modules/@types/chai/index.d.ts" />
import "reflect-metadata";
import 'mocha';
import * as chai from 'chai';
import * as sinon from 'sinon';
let expect = chai.expect, assert = chai.assert;
import * as i from '../i';
import * as nci from './i';
import { mockMessagerFactory } from '../../spec-lib';

import { CommandFactory } from './command-factory';

describe('BaseCommand', () => {
    let nc: CommandFactory;
    beforeEach(() => {
        nc = new CommandFactory(mockMessagerFactory(), []);
    });

    describe('#construct', () => {
        it("builds a command dictionary.", () => {
            let c = new CommandFactory(mockMessagerFactory(), [<any>{type: "one"}, <any>{type: "two"}]);
            expect(Object.keys(c['cmdDict']).length).to.equal(2);
            expect(c['cmdDict']['one']).to.be.not.null;
            expect(c['cmdDict']['two']).to.be.not.null;
        });
    });
    describe('#build', () => {
        it("should set tempDir and return command", () => {
            let c = new CommandFactory(mockMessagerFactory(), [<any>{type: "one"}, <any>{type: "two"}]);
            let result = c.build(<any>'one', '/my/dir');
            expect(result).to.have.property("tempDir", "/my/dir");
        });

        it("should error if command doesn't exist", () => {
            let c = new CommandFactory(mockMessagerFactory(), [<any>{type: "one"}, <any>{type: "two"}]);
            expect(() => c.build(<any>"third", "")).to.throw('Command not implemented: third.');
        });
    });
});
/// <reference path="../../../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../../../node_modules/@types/chai/index.d.ts" />
import "reflect-metadata";
import 'mocha';
import * as chai from 'chai';
import * as sinon from 'sinon';
let expect = chai.expect, assert = chai.assert;
import * as i from '../i';
import * as nci from './i';

import { BaseCommand } from './base-command';
import { mockMessagerFactory } from '../../spec-lib'
import Command from "commandpost/lib/command";

describe('BaseCommand', () => {
    let cmdDef: Command<any, any>;
    let nc: BaseCommand<any, any>;
    beforeEach(() => {
        nc = new TestBaseCommand(mockMessagerFactory(), <any>{});
        cmdDef = <any>{ help: () => "" };
    });

    describe('#validate', () => {
        it("rejects if tempDir not set.", () => {
            nc.tempDir = "";
            var result = nc["validate"](cmdDef, <any>{}, <any>{});
            assert.isRejected(result);
        });

        it("resolves if tempDir set.", () => {
            nc.tempDir = "I am set!";
            var result = nc["validate"](cmdDef, <any>{}, <any>{});
            assert.isFulfilled(result);
        });
    });
});

class TestBaseCommand extends BaseCommand<any, any> {
    public run(cmd: Command<any, any>, opts: any, args: any): Promise<{}> {
        return Promise.resolve(null);
    }    
}
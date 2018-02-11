// 3rd party imports installed via npm install
import { Test, TestFixture, AsyncTest, TestCase, AsyncSetup, AsyncTeardown, Expect, Teardown, Setup } from 'alsatian';
import { Command } from "commandpost";
import * as TypeMoq from "typemoq";
import { It, Times } from 'typemoq';
import * as _ from "lodash";

import { BaseCommand } from './base-command';
import { mockMessagerFactory } from '../../spec-lib'
import { CommandValidationResult } from '../models';

@TestFixture("Base command tests")
export class BaseCommandTests {
    cmdDef: Command<any, any>;
    c: TestCommand;

    @AsyncSetup
    public async beforeEach() {
        this.cmdDef = <any>{ help: () => "" };
        this.c = new TestCommand(mockMessagerFactory(), <NodeJS.Process><any>{});
        this.c.tempDir = "/tmp/mytemplates";
    }

    @Teardown
    public async afterEach() {

    }

    @AsyncTest("validate() returns invalid when no template directory.")
    public async validate_NoTmplDir_returnsInvalid() {
        this.c.tempDir = null;
        let result = await this.c.validator(<Command<any, any>>{}, {}, {});
        Expect(result).toBeDefined();
        Expect(result.IsError).toBe(true);
    }

    @AsyncTest("validate() returns valid when template directory.")
    public async validate_tmplDir_returnsValid() {
        let result = await this.c.validator(<Command<any, any>>{}, {}, {});
        Expect(result).toBeDefined();
        Expect(result.IsError).toBe(false);
    }
}

export class TestCommand extends BaseCommand<any, any> {
    public validator(cmd: Command<any, any>, opts: any, args: any): Promise<CommandValidationResult> {
        return this.validate(cmd, opts, args);
    }

    public run(cmd: Command<any, any>, opts: any, args: any): Promise<{}> {
        throw new Error("Method not implemented.");
    }    
}
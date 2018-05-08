// 3rd party imports installed via npm install
import { Test, TestFixture, AsyncTest, TestCase, AsyncSetup, AsyncTeardown, Teardown, Setup } from 'alsatian';
import { Command } from "commandpost";
import * as TypeMoq from "typemoq";
import { It, Times } from 'typemoq';
import * as _ from "lodash";

import { BaseCommand } from './base-command';
import { mockMessagerFactory } from '../../spec-lib'
import { CommandValidationResult, CommandResult } from '../models';
import { Assert } from 'alsatian-fluent-assertions';

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
}

export class TestCommand extends BaseCommand<any, any> {
    public async run(cmd: Command<any, any>, opts: any, args: any): Promise<CommandResult> {
        return new CommandResult();
    }
}
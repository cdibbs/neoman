import path = require('path');
import fs = require('fs');
import 'reflect-metadata';
import { SinonStub } from 'sinon';
import { Container } from 'inversify';
import { Test, TestFixture, AsyncTest, TestCase, AsyncSetup, AsyncTeardown } from 'alsatian';

import { containerBuilder } from '../lib/di/container';
import TYPES from '../lib/di/types';
import { UserMessager } from '../lib/user-messager';
import { IKernel, ISettingsProvider, IFileSystem, IUserMessager } from '../lib/i';
import { mockMessagerFactory } from '../spec-lib';
import { BaseIntegrationTest } from './base-integration';
import { Assert } from 'alsatian-fluent-assertions';

@TestFixture("Info command integration tests")
 export class InfoCommandTest extends BaseIntegrationTest {

    @AsyncTest("Displays information about a template")
    public async templateInfo() {
        await this.run(["node", "neoman", "info", "rootdemo"]);
        this.assertListsTemplates();
    }

    protected assertListsTemplates() { 
        Assert(this.intercepted)
            .matches(/Details for template identity 'rootdemo'/)
            .matches(/Name:/)
            .matches(/Base Dir:/)
            .matches(/Description:/)
            .matches(/Author:/);
    }

    @AsyncTest("Gets template info help")
    @TestCase(["node", "neoman", "info"])
    @TestCase(["node", "neoman", "help", "info"])
    public async displaysHelp(args: string[]) {
        await this.run(args);
        this.assertHelp();
    }

    protected assertHelp() {
        Assert(this.intercepted)
            .matches(/Get detailed information for a given template identifier./)
            .matches(/Usage:\s*info \[--\] \[templateId\]/);
    }
 }
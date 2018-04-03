import path = require('path');
import fs = require('fs');
import 'reflect-metadata';
import { SinonStub } from 'sinon';
import { Container } from 'inversify';
import { Test, TestFixture, AsyncTest, TestCase, AsyncSetup, AsyncTeardown, Expect } from 'alsatian';

import { containerBuilder } from '../lib/di/container';
import TYPES from '../lib/di/types';
import { UserMessager } from '../lib/user-messager';
import { IKernel, ISettingsProvider, IFileSystem, IUserMessager } from '../lib/i';
import { mockMessagerFactory } from '../spec-lib';
import { BaseIntegrationTest } from './base-integration';

@TestFixture("Info command integration tests")
 export class InfoCommandTest extends BaseIntegrationTest {

    @AsyncTest("Displays information about a template")
    public async templateInfo() {
        await this.run(["node", "neoman", "info", "rootdemo"]);
        this.assertListsTemplates();
    }

    protected assertListsTemplates() { 
        Expect(this.intercepted).toMatch(/Details for template identity 'rootdemo'/);
        Expect(this.intercepted).toMatch(/Name:/);
        Expect(this.intercepted).toMatch(/Base Dir:/);
        Expect(this.intercepted).toMatch(/Description:/);
        Expect(this.intercepted).toMatch(/Author:/);
    }

    @AsyncTest("Gets template info help")
    @TestCase(["node", "neoman", "info"])
    @TestCase(["node", "neoman", "help", "info"])
    public async displaysHelp(args: string[]) {
        await this.run(args);
        this.assertHelp();
    }

    protected assertHelp() {
        Expect(this.intercepted).toMatch(/Get detailed information for a given template identifier./);
        Expect(this.intercepted).toMatch(/Usage:\s*info \[--\] \[templateId\]/);
    }
 }
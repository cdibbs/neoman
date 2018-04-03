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

@TestFixture("List command tests")
 export class ListCommandTests extends BaseIntegrationTest {

    @AsyncTest("Displays a list of templates.")
    public async listsTemplates() {
        await this.run(["node", "neoman", "list"]);
        this.assertListsTemplates();
    }

    protected assertListsTemplates() { 
        Expect(this.intercepted).toMatch(/Using: .*neoman[\\\/]examples\n/);
        Expect(this.intercepted).toMatch(/\trootdemo - Alternate root folder demo/);
        Expect(this.intercepted).toMatch(/4 template\(s\) found.\n/);
    }
 }
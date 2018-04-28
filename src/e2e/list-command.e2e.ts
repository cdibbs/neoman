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

@TestFixture("List command tests")
 export class ListCommandTests extends BaseIntegrationTest {

    @AsyncTest("Displays a list of templates.")
    public async listsTemplates() {
        await this.run(["node", "neoman", "list"]);
        this.assertListsTemplates();
    }

    protected assertListsTemplates() { 
        Assert(this.intercepted)
            .matches(/Using: .*neoman[\\\/]examples\n/)
            .matches(/\trootdemo - Alternate root folder demo/)
            .matches(/4 template\(s\) found.\n/);
    }
 }
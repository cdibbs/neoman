import path = require('path');
import fs = require('fs');
import { AsyncTest, TestCase, TestFixture } from 'alsatian';
import { Assert } from 'alsatian-fluent-assertions';
import 'reflect-metadata';

import { BaseIntegrationTest } from './base-integration';


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
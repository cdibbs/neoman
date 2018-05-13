import path = require('path');
import fs = require('fs');
import { AsyncTest, TestFixture } from 'alsatian';
import { Assert } from 'alsatian-fluent-assertions';
import 'reflect-metadata';

import { BaseIntegrationTest } from './base-integration';


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
            .matches(/\d+ template\(s\) found.\n/);
    }
 }
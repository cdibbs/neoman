import path = require('path');
import fs = require('fs');
import { AsyncTest, TestCase, TestFixture } from 'alsatian';
import { Assert } from 'alsatian-fluent-assertions';
import 'reflect-metadata';
import { Times } from 'typemoq';
import { BaseIntegrationTest } from './base-integration';



/**
 * List of integration tests to write:
 * - X Set directory
 * - Display help
 * - Show project info
 * - Run different kinds of templates
 *   - Simplest, prove that bare bones template.json works
 *   - Various path and content transforms with input.
 *   - Pre- and post-hooks
 *   - Handlers
 */
@TestFixture("Simple Runs Test")
 export class Simple extends BaseIntegrationTest {

    @AsyncTest("Uses correct home.")
    public async listsTemplates() {
        let p = this.run(["node", "neoman", "list"])
            .then(this.assertListsTemplates.bind(this));
        await p;
    }

    protected assertListsTemplates() { 
        Assert(this.intercepted)
            .matches(/Using: .*neoman[\\\/]examples\n/)
            .matches(/\d+ template\(s\) found.\n/);
    }

    @AsyncTest("Displays help when appropriate")
    @TestCase(["node", "neoman"])
    @TestCase(["node", "neoman", "help"])
    @TestCase(["node", "neoman", "typoed"])
    public async displaysHelp(args: string[]) {
        let p = this.run(args)
            .then(this.assertHelp.bind(this))
        await p;
    }

    protected assertHelp() {
        Assert(this.intercepted)
            .matches(/Manage and run Neoman/)
            .matches(/Usage:\s*\[command\]/)
            .matches(/new/)
            .matches(/list/)
            .matches(/info/);
    }

    @AsyncTest("Displays version when requested")
    public async displaysVersion() {
        let p = this.run(["node", "neoman", "--version"])
            .then(this.assertVersion.bind(this));
        await p;
    }

    protected assertVersion() {
        Assert(this.intercepted).matches(/1\.2\.3/);
        this.exitMock.verify(m => m(), Times.atLeast(1));
    }
 }
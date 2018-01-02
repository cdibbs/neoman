import path = require('path');
import fs = require('fs');
import 'reflect-metadata';
import { SinonStub } from 'sinon';
import { Container } from 'inversify';
import { Test, TestFixture, AsyncTest, TestCase, AsyncSetup, AsyncTeardown, Expect } from 'alsatian';
let interceptStdout = require('intercept-stdout');

import { containerBuilder } from '../lib/di/container';
import TYPES from '../lib/di/types';
import { UserMessager } from '../lib/user-messager';
import { IKernel, ISettingsProvider, IFileSystem, IUserMessager } from '../lib/i';
import { mockMessagerFactory } from '../spec-lib';
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
    intercepted: string;
    unhook: () => void;

    @AsyncSetup
    public async beforeEach() {
        this.intercepted = "";
        this.unhook = interceptStdout((txt: string) => { this.intercepted += txt; return ""; });
    }

    @AsyncTeardown
    public async afterEach() {
        this.unhook();
    }

    protected async run(args: string[]) {
        return this.app
            .Go(args)
            .catch(this.assertNoErrors.bind(this));
    }

    @AsyncTest("Uses correct home and displays a list of templates.")
    public async listsTemplates() {
        this.unhook();
        let p = this.app
            .Go(["node", "neoman", "list"])
            .then(this.assertListsTemplates.bind(this));
        await p;
    }

    protected assertListsTemplates() { 
        let calls: string[][] = this.msgr["console"].log.args;
        Expect(calls[1][0]).toMatch(/Using: .*neoman\\examples\n/);
        Expect(calls[2][0]).toEqual("\trootdemo - Alternate root folder demo");
        Expect(calls[calls.length - 1][0]).toEqual("\n4 template(s) found.\n");

        if (! this.debug) {
            Expect(this.intercepted).toBeEmpty();
        }
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
        Expect(this.intercepted).toMatch(/Manage and run Neoman/);
        Expect(this.intercepted).toMatch(/Usage:\s*\[command\]/);
        Expect(this.intercepted).toMatch(/new/);
        Expect(this.intercepted).toMatch(/list/);
        Expect(this.intercepted).toMatch(/info/);
    }

    @AsyncTest("Displays version when requested")
    public async displaysVersion() {
        let p = this.run(["node", "neoman", "--version"])
            .then(this.assertVersion.bind(this));
        await p;
    }

    protected assertVersion() {
        Expect(this.intercepted).toMatch(/1\.2\.3/);
        Expect((<SinonStub><any>process.exit).called).toBe(true);
    }
 }
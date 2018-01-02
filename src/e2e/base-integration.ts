import path = require('path');
import fs = require('fs');
import 'reflect-metadata';
import * as sinon from 'sinon';
import { Container } from 'inversify';
import { Test, TestFixture, AsyncTest, AsyncSetup, AsyncTeardown, Expect } from 'alsatian';

import { containerBuilder } from '../lib/di/container';
import TYPES from '../lib/di/types';
import { UserMessager } from '../lib/user-messager';
import { IKernel, ISettingsProvider, IFileSystem, IUserMessager } from '../lib/i';
import { mockMessagerFactory } from '../spec-lib';

/**
 * List of integration tests to write:
 * - CLI
 *   X Set directory
 *   X Display help
 *   X Show version
 * - Show project info
 * - Run different kinds of templates
 *   - Simplest, prove that bare bones template.json works
 *   - Various path and content transforms with input.
 *   - Pre- and post-hooks
 *   - Handlers
 */
 export class BaseIntegrationTest {
    protected intercepted: string;
    protected unhook: () => void;
    protected debug: boolean = false;
    protected app: IKernel;
    protected mockedPath = '/tmp/neoman-e2e'
    protected msgr: IUserMessager;
    protected realProcessExit: (c?: number) => never;
    protected realWrite: (...args: any[]) => void;

    @AsyncSetup
    public async beforeEach() {
        this.realProcessExit = process.exit;
        process.exit = <any>sinon.stub();
        let cont = this.buildIntegTestContainer();
        let sp = cont.get<ISettingsProvider>(TYPES.SettingsProvider);
        Expect(<string>sp["filepath"]).toMatch(/^(?:\/tmp\/|[cC]:\\temp\\)\.neoman-settings$/);
        this.app = cont.get<IKernel>(TYPES.Kernel);

        await 
            this.captureOutput()
                .then(() => this.app.Go(["node", "neoman", "setdir", "./examples"]))
                .then(this.releaseOutput.bind(this))
                .catch(this.releaseOutput.bind(this))
                .then(() => {
                    // rebuild after settings in place.
                    cont = this.buildIntegTestContainer();
                    this.app = cont.get<IKernel>(TYPES.Kernel)
                })
                .catch(this.assertNoErrors.bind(this));
    }

    @AsyncTeardown
    public async afterEach() {
        process.exit = this.realProcessExit;
    }

    protected async captureOutput() {
        this.realWrite = process.stdout.write;
        this.intercepted = "";
        process.stdout.write = <any>sinon.spy((w: string) => {
            if (typeof w === "string")
                this.intercepted += w.replace( /\n$/ , '' ) + (w && (/\n$/).test( w ) ? '\n' : '');
        });
        return Promise.resolve(null);
    }

    protected async releaseOutput(v: any) {
        process.stdout.write = <any>this.realWrite;
        return v;
    }

    protected async run(args: string[]) {
        return this.captureOutput()
            .then(() => this.app.Go(args))
            .then(this.releaseOutput.bind(this))
            .catch(this.releaseOutput.bind(this))
            .catch(this.assertNoErrors.bind(this));
    }

    protected assertNoErrors(ex: any) {
        Expect.fail(`Exception thrown by neoman: ${ex.message} ${ex.stack}`);
    }

    protected buildIntegTestContainer(): Container {
        var cont = containerBuilder({ version: "1.2.3" }, "locales/");

        // Prevent overwriting real user home preferences by setting it to a temp dir...
        if (! process.env.USERPROFILE) {
            cont.rebind<NodeJS.Process>(TYPES.Process).toDynamicValue(() => <any>{ env: { HOME: "/tmp" }, exit: process.exit });
        } else {
            cont.rebind<NodeJS.Process>(TYPES.Process).toDynamicValue(() => <any>{ env: { USERPROFILE: "C:\\temp\\" }, exit: process.exit });
        }

        this.msgr = mockMessagerFactory({ echo: true });
        cont.rebind<IUserMessager>(TYPES.UserMessager).toDynamicValue(() => this.msgr);
        return cont;
    }
 }
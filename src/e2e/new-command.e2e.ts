import path = require('path');
import fs = require('fs');
import 'reflect-metadata';
import { SinonStub } from 'sinon';
import { Test, TestFixture, AsyncTest, TestCase, AsyncSetup, AsyncTeardown, Expect } from 'alsatian';

import { BaseIntegrationTest } from './base-integration';

@TestFixture("New command tests")
 export class NewCommandTests extends BaseIntegrationTest {

    @AsyncTest("Uses correct home and displays a list of templates.")
    @TestCase(["node", "neoman", "new" /*, missing arg */])
    @TestCase(["node", "neoman", "help", "new"])
    public async showsHelp(args: string[]) {
        let p = this.run(args)
            .then(this.assertNewHelp.bind(this));
        return p;
    }

    protected assertNewHelp() { 
        Expect(this.intercepted).toMatch(/Generate a project from a Neoman template\./);
        Expect(this.intercepted).toMatch(/Usage:  new \[options\] \[--\] \[templateId\]/);
        Expect(this.intercepted).toMatch(/--name.*\n/m);
        Expect(this.intercepted).toMatch(/--defaults.*\n/m);
        Expect(this.intercepted).toMatch(/--path.*\n/m);
        Expect(this.intercepted).toMatch(/--force.*\n/m);
        Expect(this.intercepted).toMatch(/--show-excluded.*\n/m);
    }

    @AsyncTest("Informs user of missing templateId argument.")
    public async informsMissingTmplId(args: string[]) {
        let p = this.run(["node", "neoman", "new"])
            .then(this.assertNewMissingId.bind(this));
        return p;
    }

    protected assertNewMissingId() { 
        Expect(this.intercepted).toMatch(/You must specify a template identifier./);
    }

    @AsyncTest("Can generate a simple project from an example template.")
    public async generatesSimpleProject(args: string[]) {
        var tmpDir = await this.makeTmpDir();
        console.log(tmpDir);
        let p = this.run(["node", "neoman", "new", "rootdemo", "--path", tmpDir, "--defaults"])
            .then(this.assertFilesGenerated.bind(this, tmpDir));
        return p;
    }

    protected async assertFilesGenerated(tmpDir: string) { 
        Expect(fs.existsSync(path.join(tmpDir, "index20170709.html"))).toBe(true);
        Expect(fs.existsSync(path.join(tmpDir, "package.json"))).toBe(true);
    }
 }
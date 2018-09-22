import path = require('path');
import fs = require('fs');
import { AsyncTest, TestCase, TestFixture, TestCases, Expect } from 'alsatian';
import { Assert } from 'alsatian-fluent-assertions';
import 'reflect-metadata';
import { BaseIntegrationTest } from './base-integration';


@TestFixture("New command tests")
 export class NewCommandTests extends BaseIntegrationTest {

    @AsyncTest("Uses correct home and displays a list of templates.")
    @TestCase(["node", "neoman", "new" /*, missing arg */])
    @TestCase(["node", "neoman", "help", "new"])
    public async showsHelp(args: string[]) {
        await this.run(args);
        this.assertNewHelp();
    }

    protected assertNewHelp() { 
        Assert(this.intercepted)
            .matches(/Generate a project from a Neoman template\./)
            .matches(/Usage:  new \[options\] \[--\] \[templateId\]/)
            .matches(/--name.*\n/m)
            .matches(/--defaults.*\n/m)
            .matches(/--path.*\n/m)
            .matches(/--force.*\n/m)
            .matches(/--show-excluded.*\n/m);
    }

    @AsyncTest("Informs user of missing templateId argument.")
    public async informsMissingTmplId(args: string[]) {
        await this.run(["node", "neoman", "new"]);

        Assert(this.intercepted).matches(/You must specify a template identifier./);
    }

    @AsyncTest("Can generate a simple project from an example template.")
    public async generatesSimpleProject(args: string[]) {
        var tmpDir = await this.makeTmpDir();
        await this.run(["node", "neoman", "new", "rootdemo", "--path", tmpDir, "--defaults"]);

        await new Promise((res, rej) => setTimeout(res, 25));
        Assert(fs.existsSync(path.join(tmpDir, "index20170709.html"))).equals(true);
        Assert(fs.existsSync(path.join(tmpDir, "package.json"))).equals(true);
    }
 }
import { Test, Setup, TestCase } from "alsatian";
import { PluginManager } from "./plugin-manager";
import { IUserMessager } from "../i";
import { mockMessagerFactory } from "../../spec-lib";
import { Assert, MatchMode, LocationMode } from "alsatian-fluent-assertions";
import { IMock, Mock, Times, It } from "typemoq";
import { TemplateConfiguration } from "../transformers/models/configuration";
import { IPlugin } from "./i-plugin";
import { ISubjectDefinition } from "../i/template/i-subject-definition";

export class PluginManagerTests {
    pm: PluginManager;
    msgr: IUserMessager;
    mockRequire: IMock<(key: string) => any>;
    requireTestReturn: { new(...args: any[]): any };

    @Setup
    beforeEach() {
        this.msgr = mockMessagerFactory();
        this.requireTestReturn = MockPluginClass;
        this.mockRequire = Mock.ofInstance((k: string) => {});
        this.mockRequire
            .setup(r => r(It.isAnyString()))
            .returns(() => this.requireTestReturn);
        this.pm = new PluginManager(this.msgr);
        this.pm["requireg"] = this.mockRequire.object;
    }

    @TestCase(undefined)
    @TestCase(null)
    @TestCase({})
    @Test()
    preparePlugins_yieldsEmptyPluginsFromEmptyDef(def: any) {
        Assert(this.pm.listPlugins())
            .isEmpty();
    }

    @Test()
    preparePlugins_shouldLoadPlugin() {
        const testConfig = { one: { plugin: "myplug" } };
        this.pm.preparePlugins(<any>testConfig);
        const plugins = this.pm.listPlugins();

        Assert(plugins)
            .hasElements([
                (p: TemplateConfiguration) => p.plugin === "myplug"
            ]);
        this.mockRequire.verify(r => r("neoman-plugin-myplug"), Times.once());
    }
}

export class MockPluginClass implements IPlugin {
    transform(path: string, original: string, subject: string | ISubjectDefinition, transformOrTransformer: string | ((subj: string) => string), pluginOptions: any): string {
        throw new Error("Method not implemented.");
    }

    constructor(...args: any[]) {}
    configure(pluginOptions: any): void {
        
    }
}
import { inject, injectable } from "inversify";
import TYPES from "../di/types";
import { IUserMessager } from "../i";
import { IConfiguration, IConfigurations } from "../i/template";
import { TemplateConfiguration } from "../transformers/models/configuration";
import { IPluginManager } from "./i-plugin-manager";
let NestedError = require('nested-error-stacks');
let requireg = require('requireg');

@injectable()
export class PluginManager implements IPluginManager {
    protected plugins: { [key: string]: TemplateConfiguration };

    constructor(
        @inject(TYPES.UserMessager) protected msg: IUserMessager
    ) {
        this.plugins = {};
    }
    
    getConfig(key: string): TemplateConfiguration {
        return this.plugins[key];
    }

    isPluginDefined(key: string): boolean {
        return this.plugins.hasOwnProperty(key);
    }

    listPlugins(): TemplateConfiguration[] {
        return Object
            .keys(this.plugins)
            .map(k => this.plugins[k]);
    }
   
    //FIXME Need to cover plugin loading with better tests
    preparePlugins(tconfigs: IConfigurations): void {
        this.plugins = {};
        for (let key in tconfigs) {
            let tconfig = tconfigs[key];
            let config = new TemplateConfiguration();
            config.key = key;
            config.files = tconfig.files;
            config.ignore = tconfig.ignore;
            config.plugin = tconfig.plugin;
            config.pluginOptions = tconfig.pluginOptions;
            this.loadPlugin(config, tconfig);

            this.plugins[key] = config;
        }
    }

    loadPlugin(config: TemplateConfiguration, tconfigs: IConfiguration): void {
        if (! config.plugin) {
            return; // plugin-less configurations can validly be used to organize settings.
        }

        let pluginName = `neoman-plugin-${config.plugin}`;
        let PluginClass: { new(): any };
        try {
            PluginClass = this.requireg(pluginName);
        } catch(ex) {
            throw new NestedError(this.msg.mf("Error loading plugin '{pluginName}'.", {pluginName}), ex);
        }

        try {
            config.pluginInstance = new PluginClass();
        } catch(ex) {
            throw new NestedError(this.msg.mf("Error instantiating plugin '{pluginName}'.", {pluginName}), ex);
        }

        try {
            config.pluginInstance.configure(config.pluginOptions);
        } catch(ex) {
            throw new NestedError(
                this.msg.mf(
                    "Error when calling .configure(pluginOptions) on '{pluginName}' instance.",
                    {pluginName}),
                ex);
        }
    }

    requireg = requireg;
}
import { injectable, inject } from 'inversify';
import * as _ from 'underscore';
let NestedError = require('nested-error-stacks');
let requireg = require('requireg');

import TYPES from '../di/types';
import * as i from './i';
import * as ir from '../i/template';
import * as bi from '../i';
import { TemplateConfiguration } from './models/configuration';

@injectable()
export class BaseTransformManager {
    protected splitter: RegExp = new RegExp(/^\/(.*(?!\\))\/(.*)\/([gimuy]*)$/);

    protected configs: { [key: string]: TemplateConfiguration };
    protected inputs: { [key: string]: any };

    constructor(
        @inject(TYPES.FilePatterns) protected filePatterns: bi.IFilePatterns,
        @inject(TYPES.UserMessager) protected msg: bi.IUserMessager
    ) {
        
    }

    configure(tmpl: ir.ITemplate, inputs: { [key: string]: any }) {
        this.inputs = inputs;
        this.preparePlugins(tmpl.configurations);
    }

    //FIXME Need to cover plugin loading with better tests
    preparePlugins(tconfigs: ir.IConfigurations): void {
        this.configs = {};
        for (let key in tconfigs) {
            let tconfig = tconfigs[key];
            let config = new TemplateConfiguration();
            config.key = key;
            config.files = tconfig.files;
            config.ignore = tconfig.ignore;
            config.plugin = tconfig.plugin;
            config.pluginOptions = tconfig.pluginOptions;

            let pluginName = `neoman-plugin-${config.plugin}`;
            let PluginClass: { new(): any };
            try {
                PluginClass = this.requireg(pluginName);
            } catch(ex) {
                throw new NestedError(this.msg.__mf("Error loading plugin '{pluginName}'.", { pluginName }), ex);
            }

            try {
                config.pluginInstance = new PluginClass();
            } catch(ex) {
                throw new NestedError(this.msg.__mf("Error instantiating plugin '{pluginName}'.", { pluginName }), ex);
            }

            try {
                config.pluginInstance.configure(config.pluginOptions);
            } catch(ex) {
                throw new NestedError(this.msg.__mf("Error when calling .configure(pluginOptions) on '{pluginName}' instance.", { pluginName }), ex);
            }

            this.configs[key] = config;
        }
    }

    requireg = requireg;
    
    applyReplace(original: string, tdef: ir.ITransform | ir.IPathTransform, path: string):  string {
        // Minimally, we want fast, internal regex replacement. It should be overridable within the configurations section of a template.json.
        let engine = this.chooseReplaceEngine(tdef);

        // Be wary when trying to reduce the redundant rdef.with checks; it's been tried! Type soup.
        switch(engine) {
            case "regex": return this.applyReplaceRegex(original, tdef, path);
            case "simple": return this.applyReplaceSimple(original, tdef, path);
            case "plugin": return this.applyReplacePlugin(original, tdef, path);
            default:
                throw new Error(`Unimplemented transform engine ${engine}.`);
        }
    }

    applyReplaceRegex(original: string, tdef: ir.ITransform | ir.IPathTransform, path: string): string
    {
        if (typeof tdef.with === "string")
            return original.replace(new RegExp(<string>tdef.subject, tdef.regexFlags || ""), this.preprocess(tdef.with));
        else
            return original.replace(new RegExp(<string>tdef.subject, tdef.regexFlags || ""), this.buildReplacer(tdef));
    }

    applyReplaceSimple(original: string, tdef: ir.ITransform | ir.IPathTransform, path: string): string
    {
        if (typeof tdef.with === "string")
            return original.split(<string>tdef.subject).join(this.preprocess(tdef.with));
        else
            return original.split(<string>tdef.subject).join(this.buildReplacer(tdef)(<string>tdef.subject));
    }

    applyReplacePlugin(original: string, tdef: ir.ITransform | ir.IPathTransform, path: string): string
    {
        try {
            let config = this.configs[tdef.using];
            if (typeof tdef.with === "string") {
                return config.pluginInstance.transform(path, original, tdef.subject, this.preprocess(tdef.with), _.extend({}, config.pluginOptions, tdef.params));
            } else {
                return config.pluginInstance.transform(path, original, tdef.subject, this.buildReplacer(tdef), _.extend({}, config.pluginOptions, tdef.params));
            }
        } catch (err) {
            this.msg.error(`Error running plugin from "${tdef.using}" configuration:`, 3);
            this.msg.error(err.toString(), 3);
            return original;
        }
    }

    chooseReplaceEngine(tdef: ir.ITransform | ir.IPathTransform) {
        if (! tdef)
            throw new Error("Malformed transform definition.");
        
        if (! tdef.using || tdef.using === "regex") {
            if (this.configs.hasOwnProperty("regex")) // Then, the user wants to override the default.
                return "plugin";
            
            return "regex";
        } else if (tdef.using === "simple") {
            if (this.configs.hasOwnProperty("simple"))
                return "plugin";

            return "simple";
        }

        return "plugin";
    }

    buildReplacer(tdef: ir.ITransform): (substr: string) => string {
        //TODO FIXME not truly implemented
        if (typeof tdef.with === 'object' && tdef.with.handler)
        {
            return (substr: string) => substr;
        }

        throw new Error(`Handler definition missing for transform.`);
    }

    private varMatcher = /{{[^}]*}}/g;
    preprocess(withDef: string): string {
        let result = withDef.replace(this.varMatcher, (match) => {
            return this.inputs[match.substr(2, match.length-4)] /* found it? */
                || (match === "{{{{}}" ? "{{" /* is an escape */ : match /* nope, return same */)
        });
        return result;
    }

    regexToTransform<T extends ir.ITransform | ir.IPathTransform>(def: string): T {
        let components: string[] = def.match(this.splitter);
        if (!components || components.length < 4) {
            throw new Error("Must be a valid javascript replace regular expression: /pattern/replace/[opts]");
        }

        let searchComponent: string = components[1];
        let replaceComponent: string = components[2];
        let flagsComponent: string = components[3];
        return <T>{
            "subject": searchComponent,
            "with": replaceComponent,
            "regexFlags": flagsComponent
        };
    }

    /**
     * Determines whether a config definition, and a set of include/ignore globs apply to a given path.
     * Co-recursive with configDoesApply.
     * @param path The path against which to compare globs.
     * @param files A list of include globs. Files in this list will be included unless explicitly ignored.
     * @param ignore A list of ignore globs. Overrides matches from the files parameter.
     * @param configKey A configuration definition to match (itself containing include/ignore globs).
     */
    replaceDoesApply(path: string, files: string[], ignore: string[], configKey: string): boolean {
        if (typeof files === "undefined" && typeof ignore === "undefined" && typeof configKey === "undefined")
            return true; // No explicit inclusions or exclusions --> Global replace.

        let ignoresMatch = (ignore && (ignore instanceof Array) && ignore.length) ? this.filePatterns.match(path, ignore) : [];
        if (ignoresMatch.length) { // explicit exclusion overrides explicit inclusion
            return false;
        }

        if (configKey) {
            if (this.configDoesApply(path, configKey)) {
                return true; // either-or with files match
            } else if (! files) { // not defined = nothing overriding config non-match
                return false;
            }
        }

        // if files weren't defined, implicit inclusion. Otherwise, inclusion only if match.
        let filesMatch = (files && (files instanceof Array) && files.length) ? this.filePatterns.match(path, files) : [];
        return !!(!files || !files.length || filesMatch.length);
    }

    /**
     * Determines whether a config definition applies to a given path.
     * Co-recursive with replaceDoesApply.
     * @param path The path against which to check the config definition.
     * @param configKey The key of the config containing include/ignore globs to lookup.
     */
    configDoesApply(path: string, configKey: string): boolean {
        if (this.configs.hasOwnProperty(configKey)) {
            let c = this.configs[configKey];
            let result = this.replaceDoesApply(path, c.files, c.ignore, undefined);
            return result;
        } else {
            throw new Error(`Configuration key "${configKey}" does not exist.`);
        }
    }
}
import { injectable, inject } from 'inversify';
import * as _ from 'underscore';
let NestedError = require('nested-error-stacks');
let requireg = require('requireg');

import { curry } from '../util/curry';
import { RuleMatchResult } from '../models';
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
    protected tconfigBasePath: string;

    constructor(
        @inject(TYPES.FilePatterns) protected filePatterns: bi.IFilePatterns,
        @inject(TYPES.UserMessager) protected msg: bi.IUserMessager,
        @inject(TYPES.HandlerService) protected hnd: bi.IHandlerService
    ) {
        
    }

    configure(tmpl: ir.ITemplate, inputs: { [key: string]: any }) {
        this.inputs = inputs;
        this.preparePlugins(tmpl.configurations);
        this.tconfigBasePath = tmpl.__tmplPath;
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
                throw new NestedError(this.msg.i18n({pluginName}).mf("Error loading plugin '{pluginName}'."), ex);
            }

            try {
                config.pluginInstance = new PluginClass();
            } catch(ex) {
                throw new NestedError(this.msg.i18n({pluginName}).mf("Error instantiating plugin '{pluginName}'."), ex);
            }

            try {
                config.pluginInstance.configure(config.pluginOptions);
            } catch(ex) {
                throw new NestedError(this.msg.i18n({pluginName}).mf("Error when calling .configure(pluginOptions) on '{pluginName}' instance."), ex);
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
            this.msg.error(err.message, 3);
            this.msg.error(err.stack, 4);
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
            let hndName = tdef.with.handler;
            let handler = this.hnd.resolveAndLoadSync(this.tconfigBasePath, hndName);
            return curry.twoOf3((tdef, hndName, original) => {
                try {
                    let replacement = tdef.with["value"]; // if any...
                    return handler(original, replacement, tdef);
                } catch (ex) {
                    let errorMsg = this.msg.i18n({hndName}).mf("Error while running user handler '{hndName}'");
                    throw new NestedError(errorMsg, ex);
                }
            }, this, tdef, hndName);
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
    replaceDoesApply(path: string, files: string[], ignore: string[], configKey: string): RuleMatchResult {
        if (typeof files === "undefined" && typeof ignore === "undefined" && typeof configKey === "undefined")
        {
            let reason = "Applies globally because no explicit exclusion or inclusion rules defined.";
            return new RuleMatchResult(true, reason);
        }

        let ignoresMatch = (ignore && (ignore instanceof Array) && ignore.length) ? this.filePatterns.match(path, ignore) : [];
        if (ignoresMatch.length) { // explicit exclusion overrides explicit inclusion
            let reason = "Explicitly excluded by user-defined 'ignore' rules.";
            return new RuleMatchResult(false, reason, null, ignoresMatch);
        }

        if (configKey) {
            let configResult = this.configDoesApply(path, configKey);
            if (configResult.matches) {
                let reason = "Included because of 'using' directive: {configKey}.";
                return new RuleMatchResult(true, reason, configResult);
            } else if (! files) { // not defined = nothing overriding config non-match
                let reason = "Excluded because 'using' directive '{configKey}' does not match, and no explicit, overriding inclusion rule exists.";
                return new RuleMatchResult(false, reason, configResult);
            }
        }

        // if files weren't defined, implicit inclusion. Otherwise, inclusion only if match.
        let filesMatch = (files && (files instanceof Array) && files.length) ? this.filePatterns.match(path, files) : [];
        if (!files || !files.length) {
            let reason = "Included implicitly because no 'using' or 'ignore' rule caused explicit exclusion.";
            return new RuleMatchResult(true, reason);
        } else if (filesMatch.length) {
            let reason = "Included explicitly by matching 'files' include rules, while no overriding 'ignore' rules match.";
            return new RuleMatchResult(true, reason, null, filesMatch);
        }

        let reason = "Excluded implicitly because explicit 'files' include rules defined, yet none match.";
        return new RuleMatchResult(false, reason);
    }

    /**
     * Determines whether a config definition applies to a given path.
     * Co-recursive with replaceDoesApply.
     * @param path The path against which to check the config definition.
     * @param configKey The key of the config containing include/ignore globs to lookup.
     */
    configDoesApply(path: string, configKey: string): RuleMatchResult {
        if (this.configs.hasOwnProperty(configKey)) {
            let c = this.configs[configKey];
            let result = this.replaceDoesApply(path, c.files, c.ignore, undefined);
            return result;
        } else {
            throw new Error(`Configuration key "${configKey}" does not exist.`);
        }
    }
}
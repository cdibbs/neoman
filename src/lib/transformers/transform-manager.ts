import { injectable, inject } from 'inversify';
import * as _ from 'underscore';
let requireg = require('requireg');

import TYPES from '../di/types';
import * as i from './i';
import * as ir from '../i/template';
import * as bi from '../i';
import { TemplateConfiguration } from './models/configuration';

@injectable()
export class TransformManager implements i.ITransformManager{
    configs: { [key: string]: TemplateConfiguration };
    inputs: { [key: string]: any };

    constructor(
        @inject(TYPES.FilePatterns) private filePatterns: bi.IFilePatterns,
        @inject(TYPES.UserMessager) private msg: bi.IUserMessager
    ) {

    }

    configure(tmpl: ir.ITemplate, inputs: { [key: string]: any }) {
        this.configs = {};
        this.inputs = inputs;
        let tconfigs: ir.IConfigurations = tmpl.configurations;

        for (let key in tconfigs) {
            let tconfig = tconfigs[key];
            let config = new TemplateConfiguration();
            config.key = key;
            config.files = tconfig.files;
            config.ignore = tconfig.ignore;
            config.parserPlugin = tconfig.parserPlugin;
            config.parserOptions = tconfig.parserOptions;
            let PluginClass = requireg(`neoman-plugin-${config.parserPlugin}`);
            console.log(PluginClass);
            config.pluginInstance = new PluginClass();
            config.pluginInstance.configure(config.parserOptions);
            this.configs[key] = config;
        }
    }

    applyTransforms(path: string, content: string, rdef: ir.ReplacementsDefinition): string {
        if (rdef instanceof Array) {
            return this.replaceInFile(path, content, <ir.IReplacementDefinition[]>rdef);
        } else if (typeof rdef === "string") { // simple regexp?
            return content;
        } else if (typeof rdef === "object") { // single replacement? treat as rdef
            return this.replaceInFile(path, content, [rdef]);
        }

        throw new Error(`Replace definition not understood. Type found: ${typeof rdef}.`);
    }

    private splitter: RegExp = new RegExp(/^\/(.*(?!\\))\/(.*)\/([gimuy]*)$/).compile();
    buildSingleRegexDef(rdef: string): ir.IReplacementDefinition {
        let components: string[] = rdef.match(this.splitter);
        let searchComponent: string = components[1];
        let replaceComponent: string = components[2];
        let flagsComponent: string = components[3];
        return <ir.IReplacementDefinition>{
            "replace": searchComponent,
            "with": replaceComponent,
            "regex": true,
            "regexFlags": flagsComponent
        };
    }

    replaceInFile(path: string, content: string, rdefs: ir.IReplacementDefinition[] | string[]): string {
        let count = 0;
        for (let i=0; i<rdefs.length; i++) {
            let rdef = rdefs[i];
            if (typeof rdef === "string" && rdef[0] !== "#") {
                // Assume its a regex
                rdef = this.buildSingleRegexDef(rdef);
            }
            
            if (typeof rdef === "object") {
                if (this.replaceDoesApply(path, rdef.files, rdef.ignore, rdef.configuration)) {
                    this.msg.debug(`Applying transform definition for "${rdef.replace}"${rdef.configuration ? ' (config: ' + rdef.configuration + ')' : ""}.`, 2)
                    count ++;
                    //this.msg.debug(`Applying replace definition for ${rdef.replace}...`);
                    content = this.applyReplace(content, rdef, path);
                } else {
                    this.msg.debug(`Skipping transform definition for "${rdef.replace}"${rdef.configuration ? ' (config: ' + rdef.configuration + ')' : ""}.`, 2);
                }
            } else {
                throw new Error(`Unrecognized replacement definition ${i}, type: ${typeof rdef}.`);
            }
        }
        //this.msg.debug(`${count} replacements.`);

        return content;
    }

    applyReplace(content: string, rdef: ir.IReplacementDefinition, path: string):  string {
        // Minimally, we want fast, internal regex replacement. It should be overridable within the configurations section of a template.json.
        let engine = this.chooseReplaceEngine(rdef);
        switch(engine) {
            case "regex":
                if (typeof rdef.with === "string")
                    return content.replace(new RegExp(<string>rdef.replace, rdef.regexFlags || ""), this.preprocess(rdef.with));
                else
                    return content.replace(new RegExp(<string>rdef.replace, rdef.regexFlags || ""), this.buildReplacer(rdef));
            case "simple":
                if (typeof rdef.with === "string")
                    return content.split(<string>rdef.replace).join(this.preprocess(rdef.with));
                else
                    return content.split(<string>rdef.replace).join(this.buildReplacer(rdef)(<string>rdef.replace));
            case "plugin":
                try {
                    let config = this.configs[rdef.configuration];
                    if (typeof rdef.with === "string") {
                        return config.pluginInstance.transform(path, content, rdef.replace, this.preprocess(rdef.with), _.extend({}, config.parserOptions, rdef.params));
                    } else {
                        return config.pluginInstance.transform(path, content, rdef.replace, this.buildReplacer(rdef), _.extend({}, config.parserOptions, rdef.params));
                    }
                } catch (err) {
                    this.msg.error(`Error running plugin from "${rdef.configuration}" configuration:`, 3);
                    this.msg.error(err, 3);
                    return content;
                }
            default:
                throw new Error(`Unimplemented replacement engine ${engine}.`);
        }
    }

    chooseReplaceEngine(rdef: ir.IReplacementDefinition) {
        if (! rdef.configuration || rdef.configuration === "regex") {
            if (this.configs.hasOwnProperty("regex")) // Then, the user wants to override the default.
                return "plugin";
            
            return "regex";
        } else if (rdef.configuration === "simple") {
            if (this.configs.hasOwnProperty("simple"))
                return "plugin";

            return "simple";
        }

        return "plugin";
    }

    buildReplacer(rdef: ir.IReplacementDefinition): (substr: string) => string {
        //TODO FIXME not truly implemented
        if (typeof rdef.with === 'object' && rdef.with.handler)
        {
            return (substr: string) => substr;
        }

        throw new Error(`Handler definition missing for replace '${rdef.replace}'.`);
    }

    private varMatcher = /{{[^}]*}}/g;
    preprocess(withDef: string): string {
        let result = withDef.replace(this.varMatcher, (match) => {
            return this.inputs[match.substr(2, match.length-4)] /* found it? */
                || (match === "{{{{}}" ? "{{" /* is an escape */ : match /* nope, return same */)
        });
        return result;
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
        if (typeof files === "undefined" && typeof ignore === "undefined")
            return true; // No explicit inclusions or exclusions. Global replace.
        
        let configMatches = configKey ? this.configDoesApply(path, configKey) : true;
        let filesMatch = (files && (files instanceof Array) && files.length) ? this.filePatterns.match(path, files) : [];
        let ignoresMatch = (ignore && (ignore instanceof Array) && ignore.length) ? this.filePatterns.match(path, ignore) : [];
        console.log(configMatches, files, path, filesMatch, ignoresMatch);

        if (typeof files === "undefined" && (typeof ignore !== "undefined" && ! ignoresMatch.length))
            return configMatches; // Files undefined, ignores defined, but no ignore matches. Global replace if config matches.

        return (configMatches && filesMatch.length && !ignoresMatch.length);
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
            return this.replaceDoesApply(path, c.files, c.ignore, null);
        } 
    }
}
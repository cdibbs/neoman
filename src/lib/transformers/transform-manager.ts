import { injectable, inject } from 'inversify';

import TYPES from '../di/types';
import * as i from './i';
import * as ir from '../i/template';
import * as bi from '../i';
import { TemplateConfiguration } from './models/configuration';

@injectable()
export class TransformManager implements i.ITransformManager{
    configs: { [key: string]: TemplateConfiguration };

    constructor(
        @inject(TYPES.FilePatterns) private filePatterns: bi.IFilePatterns,
        @inject(TYPES.UserMessager) private msg: bi.IUserMessager
    ) {

    }

    configure(tmpl: ir.ITemplate) {
        this.configs = {};
        let tconfigs: ir.IConfigurations = tmpl.configurations;
        for (let key in tconfigs) {
            let tconfig = tconfigs[key];
            let config = new TemplateConfiguration();
            config.key = key;
            config.files = tconfig.files;
            config.ignore = tconfig.ignore;
            config.parserPlugin = tconfig.parserPlugin;
            config.parserOptions = tconfig.parserOptions;
            config.pluginInstance = require(`neoman-plugin-${config.parserPlugin}`);
            config.pluginInstance.configure(config.parserOptions);
            this.configs[key] = config;
        }
    }

    applyTransforms(path: string, content: string, rdef: ir.ReplacementsDefinition): string {
        if (rdef instanceof Array) {
            return this.replaceInFile(path, content, <ir.IReplacementDefinition[]>rdef);
        } else if (typeof rdef === "string") { // simple regexp?
            return content;
        } else if (typeof rdef === "object") { // single replacement? probably a namespace or similar.
            return content;
        }

        throw new Error(`Replace definition not understood. Type found: ${typeof rdef}.`);
    }

    replaceInFile(path: string, content: string, rdefs: ir.IReplacementDefinition[] | string[]): string {
        let count = 0;
        for (let i=0; i<rdefs.length; i++) {
            let rdef = rdefs[i];
            if (typeof rdef === "string") {
                // Assume its a comment, for now. Later, we might look to see if its a regexp.
            } else if (typeof rdef === "object") {
                if (this.replaceDoesApply(path, rdef.files, rdef.ignore, rdef.configuration)) {
                    this.msg.debug(`Applying transform definition ${rdef.configuration || rdef.replace }.`, 2)
                    count ++;
                    //this.msg.debug(`Applying replace definition for ${rdef.replace}...`);
                    content = this.applyReplace(content, rdef);
                }
            } else {
                throw new Error(`Unrecognized replacement definition ${i}, type: ${typeof rdef}.`);
            }
        }
        //this.msg.debug(`${count} replacements.`);

        return content;
    }

    applyReplace(content: string, rdef: ir.IReplacementDefinition):  string {
        if (rdef.regex) {
            if (typeof rdef.with === "string")
                return content.replace(new RegExp(<string>rdef.replace), this.preprocess(rdef.with));
            else
                return content.replace(new RegExp(<string>rdef.replace), this.buildReplacer(rdef));
        } else {
            if (typeof rdef.with !== "string")
                return content; //throw new Error("Replace regular string with action call result not implemented, yet. Sorry.");

            return content.split(<string>rdef.replace).join(this.preprocess(rdef.with));
        }
    }

    buildReplacer(rdef: ir.IReplacementDefinition): (substr: string) => string {
        //TODO FIXME not truly implemented
        if (typeof rdef.with === 'object' && rdef.with.handler)
        {
            return (substr: string) => substr;
        }

        throw new Error(`Not yet implemented for 'with' is '${typeof rdef.with}'.`);
    }

    preprocess(withDef: string): string {
        // TODO FIXME
        return withDef;
    }

    replaceDoesApply(path: string, files: string[], ignore: string[], configuration: string): boolean {
        if (typeof files === "undefined" && typeof ignore === "undefined")
            return true; // No explicit inclusions or exclusions. Global replace.

        let filesMatch = (files && (files instanceof Array) && files.length) ? this.filePatterns.match(path, files) : [];
        let ignoresMatch = (ignore && (ignore instanceof Array) && ignore.length) ? this.filePatterns.match(path, ignore) : [];

        // TODO FIXME configuration
        if (configuration) return false;

        if (typeof files === "undefined" && (typeof ignore !== "undefined" && ! ignoresMatch.length))
            return true; // Files undefined, but no ignore matches. Global replace.

        return (filesMatch.length && !ignoresMatch.length);
    }
}
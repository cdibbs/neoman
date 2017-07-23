import { injectable, inject } from 'inversify';
let requireg = require('requireg');

import TYPES from '../di/types';
import * as i from './i';
import * as ir from '../i/template';
import * as bi from '../i';
import { BaseTransformManager } from './base-transform-manager';
import { TemplateConfiguration } from './models/configuration';

@injectable()
export class TransformManager extends BaseTransformManager implements i.ITransformManager{

    constructor(
        @inject(TYPES.FilePatterns) filePatterns: bi.IFilePatterns,
        @inject(TYPES.UserMessager) msg: bi.IUserMessager
    ) {
        super(filePatterns, msg);
    }

    configure(tmpl: ir.ITemplate, inputs: { [key: string]: any }) {
        this.inputs = inputs;
        this.preparePlugins(tmpl.configurations);
    }

    applyTransforms(path: string, content: string, rdef: ir.Transforms): string {
        if (rdef instanceof Array) {
            return this.replaceInFile(path, content, <ir.ITransform[]>rdef);
        } else if (typeof rdef === "string") { // simple regexp
            if (! this.isComment(rdef)) {
                return this.replaceInFile(path, content, [this.buildSingleRegexDef(rdef)]);
            } else {
                return content;
            }
        } else if (typeof rdef === "object") { // single replacement? treat as rdef
            return this.replaceInFile(path, content, [rdef]);
        }

        throw new Error(`Replace definition not understood. Type found: ${typeof rdef}.`);
    }

    buildSingleRegexDef(rdef: string): ir.ITransform {
        let components: string[] = rdef.match(this.splitter);
        let searchComponent: string = components[1];
        let replaceComponent: string = components[2];
        let flagsComponent: string = components[3];
        return <ir.ITransform>{
            "subject": searchComponent,
            "with": replaceComponent,
            "regexFlags": flagsComponent
        };
    }

    replaceInFile(path: string, content: string, rdefs: ir.ITransform[] | string[]): string {
        let count = 0;
        for (let i=0; i<rdefs.length; i++) {
            let rdef = rdefs[i];
            if (typeof rdef === "string") {
                if (this.isComment(rdef)) {
                    continue;
                }
                
                rdef = this.buildSingleRegexDef(rdef);
            }
            
            if (typeof rdef === "object") {
                if (this.replaceDoesApply(path, rdef.files, rdef.ignore, rdef.using)) {
                    this.msg.debug(`Applying transform definition for "${rdef.subject}"${rdef.using ? ' (config: ' + rdef.using + ')' : ""}.`, 2)
                    count ++;
                    //this.msg.debug(`Applying replace definition for ${rdef.replace}...`);
                    content = this.applyReplace(content, rdef, path);
                } else {
                    this.msg.debug(`Skipping transform definition for "${rdef.subject}"${rdef.using ? ' (config: ' + rdef.using + ')' : ""}.`, 2);
                }
            } else {
                throw new Error(`Unrecognized replacement definition ${i}, type: ${typeof rdef}.`);
            }
        }
        //this.msg.debug(`${count} replacements.`);

        return content;
    }
}
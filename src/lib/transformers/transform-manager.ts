import { injectable, inject } from 'inversify';

import TYPES from '../di/types';
import * as i from './i';
import * as ir from '../i/template';
import * as bi from '../i';

@injectable()
export class TransformManager implements i.ITransformManager{

    constructor(
        @inject(TYPES.TransformManager) private filePatterns: bi.IFilePatterns
    ) {}

    applyTransforms(content: string, replaceDef: ir.IReplacementDefinition): string {
        throw new Error("Method not implemented.");
    }

        replaceAllInFile(path: string, content: string, rdef: ir.ReplacementsDefinition): string {
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
            return content.replace(new RegExp(<string>rdef.replace), this.buildReplacer(rdef));
        } else {
            if (rdef.with !== "string")
                return content; //throw new Error("Replace regular string with action call result not implemented, yet. Sorry.");

            return content.split(<string>rdef.replace).join(rdef.with);
        }
    }

    buildReplacer(rdef: ir.IReplacementDefinition): (substr: string) => string {
        if (typeof rdef.with === "string") {
             return (substr: string) => { console.log("1"); return <string>rdef.with };
        } else if (typeof rdef.with === "object" && rdef.with.action) {
            //TODO FIXME not truly implemented
            return (substr: string) => { console.log("2"); return substr; };
        }

        throw new Error(`Not yet implemented for 'with' is '${typeof rdef.with}'.`);
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
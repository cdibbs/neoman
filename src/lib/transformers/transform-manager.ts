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
        @inject(TYPES.UserMessager) msg: bi.IUserMessager,
        @inject(TYPES.HandlerService) hnd: bi.IHandlerService
    ) {
        super(filePatterns, msg, hnd);
    }

    applyTransforms(path: string, content: string, rdef: ir.Transforms): string {
        if (rdef instanceof Array) {
            return this.replaceInFile(path, content, <ir.ITransform[]>rdef);
        } else if (typeof rdef === "string") { // simple regexp
            return this.replaceInFile(path, content, [this.regexToTransform(rdef)]);
        } else if (typeof rdef === "object") { // single replacement? treat as rdef
            return this.replaceInFile(path, content, [rdef]);
        }

        throw new Error(`Replace definition not understood. Type found: ${typeof rdef}.`);
    }

    replaceInFile(path: string, content: string, rdefs: ir.ITransform[] | string[]): string {
        for (let i=0; i<rdefs.length; i++) {
            let rdef = rdefs[i];
            if (typeof rdef === "string") {              
                rdef = this.regexToTransform(rdef);
            }
            
            if (typeof rdef === "object") {
                content = this.replaceOne(path, content, rdef);
            } else {
                throw new Error(`Unrecognized replacement definition ${i}, type: ${typeof rdef}.`);
            }
        }

        return content;
    }

    replaceOne(path: string, content: string, rdef: ir.ITransform): string {
        let using: string;
        if (rdef.using) {
            using = ` (config: ${rdef.using})`;
        } else if (rdef.with && rdef.with["handler"]) {
            using = ` (handler: ${rdef.with['handler']})`;
        } else {
            using = "";
        }

        let msgCtxt = this.msg.i18n({subject: rdef.subject, using });

        if (this.replaceDoesApply(path, rdef.files, rdef.ignore, rdef.using)) {
            msgCtxt.debug('Applying transform definition for "{subject}"{using}', 2)
            content = this.applyReplace(content, rdef, path);
        } else {
            msgCtxt.debug('Skipping transform definition for "{subject}"{using}', 2);
        }

        return content;
    }
}
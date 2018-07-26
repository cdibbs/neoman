import { injectable, inject } from 'inversify';
let requireg = require('requireg');

import TYPES from '../di/types';
import * as i from './i';
import * as ir from '../i/template';
import * as bi from '../i';
import { BaseTransformManager } from './base-transform-manager';
import { TemplateConfiguration } from './models/configuration';
import { RuleMatchResult } from '../models';
import { IUserMessager } from '../i';

@injectable()
export class ContentTransformManager extends BaseTransformManager implements i.ITransformManager{

    constructor(
        @inject(TYPES.FilePatterns) filePatterns: bi.IFilePatterns,
        @inject(TYPES.UserMessager) msg: bi.IUserMessager,
        @inject(TYPES.HandlerService) hnd: bi.IHandlerService
    ) {
        super(filePatterns, msg, hnd);
    }

    applyTransforms(path: string, content: string, rdef: ir.Transforms): string {
        if (typeof rdef === "undefined") {
            return content;
        } else if (rdef instanceof Array) {
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
        let src: string = this.formatSource(rdef);

        let msgCtxt = this.msg.i18n({subject: rdef.subject, src });

        let check = this.replaceDoesApply(path, rdef.files, rdef.ignore, rdef.using);
        if (check.matches) {
            msgCtxt.debug('Applying transform definition for "{subject}"{src}.', 2)
            content = this.applyReplace(content, rdef, path);
        } else {
            let nest = msgCtxt.debug('Skipping transform definition for "{subject}"{src}.', 2);
            this.displaySkipReason(msgCtxt, check);
        }

        return content;
    }

    protected displaySkipReason(msgCtxt: IUserMessager, check: RuleMatchResult) {
        msgCtxt = msgCtxt.i18n({rules: check.rules});
        let reason = msgCtxt.mf(check.reason);
        msgCtxt = msgCtxt.i18n({reason, rulesSummary: (check.rules || []).join(', ') || "N/A" });
        msgCtxt.debug("Reason: {reason}");
        let nest = msgCtxt.debug("Rule(s): {rules}");

        if (check.nestedRuleMatchResult) {
            this.displaySkipReason(nest, check.nestedRuleMatchResult);
        }
    }

    protected formatSource(rdef: ir.ITransform): string {
        let srcs = [];
        if (rdef.using) {
            srcs.push(`using: ${rdef.using}`);
        }
        
        if (rdef.with && rdef.with["handler"]) {
            srcs.push(`handler: ${rdef.with['handler']}`);
        }

        return srcs.length ? ' (' + srcs.join(', ') + ')' : '';
    }
}
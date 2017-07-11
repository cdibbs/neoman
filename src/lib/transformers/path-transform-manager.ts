import { injectable, inject } from 'inversify';
import * as _ from 'underscore';
let requireg = require('requireg');

import TYPES from '../di/types';
import * as i from './i';
import * as ir from '../i/template';
import * as bi from '../i';
import { BaseTransformManager } from './base-transform-manager';
import { TemplateConfiguration } from './models/configuration';

@injectable()
export class PathTransformManager extends BaseTransformManager implements i.IPathTransformManager{
    configs: { [key: string]: TemplateConfiguration };
    inputs: { [key: string]: any };

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

    applyTransforms(path: string, tdef: ir.PathTransforms): string {
        if (tdef instanceof Array) {
            return this.transformAll(path, <ir.IPathTransform[]>tdef);
        } else if (typeof tdef === "string") { // simple regexp?
            if (! this.isComment(tdef)) {
                return this.transformAll(path, [this.regexToTransform(tdef)]);
            } else {
                return path;
            }
        } else if (typeof tdef === "object") { // single replacement? treat as rdef
            return this.transformAll(path, [tdef]);
        }

        throw new Error(`Replace definition not understood. Type found: ${typeof tdef}.`);
    }

    transformAll(path: string, transforms: ir.IPathTransform[] | string[]): string {
        let processing = path;

        for (let i in transforms) {
            let t = transforms[i];
            if (typeof t === "string") {
                if (this.isComment(t)) {
                    continue;
                }
                
                t = this.regexToTransform(t);
            }

            if (typeof t === "object") {
                if (this.replaceDoesApply(processing, t.files, t.ignore, t.configuration)) {
                    processing = this.applyIfMatch(t, processing);
                } else {
                    this.msg.debug(`Skipping path transform def #${i}, "${t.subject}" (no match: config or globs).`, 2);
                }
            } else {
                throw new Error(`I do not understand format of path transform #${i + 1}, type ${typeof t}.`);
            }
        }

        return processing;
    }

    applyIfMatch(t: ir.IPathTransform, path: string): string {
        if (path.match(t.subject)) {
            this.msg.debug(`Applying path transform for "${t.subject}".`, 2);
            path = this.applyReplace(path, t, path);
            this.msg.debug(`Int. result: ${path}`, 3);
        } else {
            this.msg.debug(`Skipping path transform def #${i} (no match: "${t.subject}").`, 2);
        }

        return path;
    }

    regexToTransform(regexStr: string): ir.IPathTransform {
        let components: string[] = regexStr.match(this.splitter);
        let searchComponent: string = components[1];
        let replaceComponent: string = components[2];
        let flagsComponent: string = components[3];
        return <ir.IPathTransform>{
            "subject": searchComponent,
            "with": replaceComponent,
            "regexFlags": flagsComponent
        };
    }
}
import { injectable, inject } from 'inversify';
import * as fse from 'fs-extra';

import { EventEmitter, TemplateFilesEmitterType } from '../emitters';
import { COMMANDS, Commands } from '../commands';
import { VERBOSITY, Verbosity } from '../types/verbosity';
import { RunOptions, RunnerResult, CommandErrorType } from '../models';
import TYPES from '../di/types';
import KEYS from '../settings-keys';
import * as iemitters from '../emitters/i';
import { ITemplate, Transforms, PathTransforms } from '../i/template';
import * as it from '../transformers/i';
import { curry } from '../util/curry';
import { IFSTreeProcessor } from "./i";
import { ITemplateValidator, IUserMessager, IFileSystem, IPath, IFilePatterns, IInputManager, ITemplateRunner } from "../i";

@injectable()
export class TemplateRunner implements ITemplateRunner {

    constructor(
        @inject(TYPES.UserMessager) protected msg: IUserMessager,
        @inject(TYPES.FS) private fs: IFileSystem,
        @inject(TYPES.InputManager) private inputManager: IInputManager,
        @inject(TYPES.TemplateValidator) private validator: ITemplateValidator,
        @inject(TYPES.FSTreeProcessor) private fsTreeProcessor: IFSTreeProcessor
    ) {
    }

    public async run(destPath: string, options: RunOptions, tmpl: ITemplate): Promise<RunnerResult> {
        let results: string[] = [];
        if (!this.validate(tmpl)) {
            return new RunnerResult(this.msg.mf("Template configuration not valid."), CommandErrorType.SystemState);
        }

        if (!this.destinationEmpty(destPath) && !options.force) {
            return new RunnerResult(this.msg.i18n({destPath}).mf('The destination directory is not empty ({path}).'), CommandErrorType.SystemState);
        }

        let answers = await this.inputManager.ask(tmpl.input, options);
        let result = await this.fsTreeProcessor.process(tmpl.__tmplPath, destPath, options, answers, tmpl);
        this.finishRun(result);
        return result;
    }

    protected finishRun(result: RunnerResult): RunnerResult {
        this.msg.i18n(result)
            .info('{processed} file(s) considered.')
            .info('{excluded} file(s) excluded.')
            .info('{totalFiles} file(s) copied.');
        return result;
    }

    protected destinationEmpty(path: string): boolean {
        return this.fs.readdirSync(path).length === 0;
    }

    protected validate(tmpl: ITemplate): boolean {
        let deps = this.validator.dependenciesInstalled(tmpl);
        let missing: boolean = false;
        for(var key in deps) {
            let depInstalled = deps[key];
            if (!depInstalled) {
                this.msg
                    .i18n({ name: tmpl.name, key })
                    .write("Template '{name}' requires npm package '{key}', which is not installed.");
                missing = true;
            }
        }

        return !missing;
    }
}
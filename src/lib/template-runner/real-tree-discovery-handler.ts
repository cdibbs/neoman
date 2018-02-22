import { injectable, inject } from 'inversify';

import { VERBOSITY, Verbosity } from '../types/verbosity';
import { PathTransforms, Transforms } from "../i/template";
import { ITemplateFile } from "../i";
import { BaseTreeDiscoveryHandler } from "./base-tree-discovery-handler";


@injectable()
export class RealTreeDiscoveryHandler extends BaseTreeDiscoveryHandler {
    protected matchTmplFile(path: string, pathTransforms: PathTransforms, transforms: Transforms, verbosity: Verbosity, tmplFile: ITemplateFile): void {
        if (verbosity === VERBOSITY.debug)
            this.msg.i18n({absPath: tmplFile.absolutePath}).debug("Include: {absPath}");

        this.msg.i18n({absPath: tmplFile.absolutePath})
            .info('Processing {absPath}...')
            .debug(`Applying path transforms...`, 1);
        let destRelPath = this.pathTransformManager.applyTransforms(tmplFile.relativePath, pathTransforms);
        let destFile = this.path.join(path, destRelPath);
        let destPath = this.path.dirname(destFile);
        let content = this.readFileSync(tmplFile.absolutePath).toString("utf8");
        this.msg.i18n().debug(`Applying transforms...`, 1);
        content = this.transformManager.applyTransforms(tmplFile.relativePath, content, transforms);
        this.msg.i18n({destFile}).debug('Writing to destination: {destFile}', 1);
        this.ensureDirSync(destPath);
        this.writeFileSync(destFile, content);
        this.msg.i18n().debug('Done.');
    }
}
import { injectable, inject } from 'inversify';
import { VERBOSITY, Verbosity } from '../types/verbosity';
import { ITemplateFile } from "../i";
import { BaseTreeDiscoveryHandler } from "./base-tree-discovery-handler";
import { PathTransforms, Transforms } from '../user-extensibility/template';

@injectable()
export class SimulatedTreeDiscoveryHandler extends BaseTreeDiscoveryHandler {
    protected async matchTmplFile(path: string, pathTransforms: PathTransforms, transforms: Transforms, verbosity: Verbosity, tmplFile: ITemplateFile): Promise<void> {
        if (verbosity === VERBOSITY.debug)
            this.msg.i18n({absPath: tmplFile.absolutePath}).debug("Include: {absPath}");

        this.msg.i18n({absPath: tmplFile.absolutePath})
            .info('Processing {absPath}...')
            .debug(`Applying path transforms...`, 1);
        let destRelPath = await this.pathTransformManager.applyTransforms(tmplFile.relativePath, pathTransforms);
        let destFile = this.path.join(path, destRelPath);
        let destPath = this.path.dirname(destFile);
        let content = this.readFileSync(tmplFile.absolutePath).toString("utf8");
        this.msg.i18n().debug(`Applying transforms...`, 1);
        content = await this.transformManager.applyTransforms(tmplFile.relativePath, content, transforms);
        this.msg.i18n({destPath}).info('SIMULATION: Would ensure {destPath} exists and create, if not.');
        // FIXME: TODO: check permissions for path and file creation 
        //this.ensureDirSync(destPath);
        this.msg.i18n({destFile, len: content.length}).info('SIMULATION: Would write {len} bytes to destination file, {destFile}.', 1);
        //this.writeFileSync(destFile, content);
        this.msg.i18n().debug('Done.');
    }
}
import { IConfiguration } from '../../i/template';
import { ITransformPlugin } from '../../user-extensibility/i-transform-plugin';

export class TemplateConfiguration implements IConfiguration {
    key: string;
    pluginInstance: ITransformPlugin;

    files: string[];
    ignore: string[];
    plugin: string;
    npmPluginName: string;
    pluginOptions: any;

    rawConfig: IConfiguration;
}
import { IConfiguration } from '../../i/template';
import { IPlugin } from '../../plugin-manager/i-plugin';

export class TemplateConfiguration implements IConfiguration {
    key: string;
    pluginInstance: IPlugin;

    files: string[];
    ignore: string[];
    plugin: string;
    pluginOptions: any;
}
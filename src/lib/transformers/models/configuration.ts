import { IConfiguration } from '../../i/template';

export class TemplateConfiguration implements IConfiguration {
    key: string;
    pluginInstance: any;

    files: string[];
    ignore: string[];
    plugin: string;
    pluginOptions: any;
}
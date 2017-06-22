import { IConfiguration } from '../../i/template';

export class TemplateConfiguration implements IConfiguration {
    key: string;
    pluginInstance: any;

    files: string[];
    ignore: string[];
    parserPlugin: string;
    parserOptions: any;
}
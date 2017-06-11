export interface ITemplateConfiguration {
    identification: string;
    parserPlugin: string;
}

export interface ITemplateConfigurations {
    [key: string]: ITemplateConfiguration;
}
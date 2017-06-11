export interface ITemplateTypedInput {
    prompt: string;

    type: string;
}

export interface ITemplateScriptedInput {
    promptScript: string;
}

export interface ITemplateInputs {
    [key: string]: string | ITemplateTypedInput | ITemplateScriptedInput;
}
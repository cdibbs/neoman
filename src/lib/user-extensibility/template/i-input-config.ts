import { ITemplateComments } from "./i-template-comments";

export interface ITemplateTypedInput extends ITemplateComments {
    prompt: string;

    /** A javascript type. */
    type: string;

    /** The default value. */
    default?: any;

    /** A regular expression, for now. Later, a handler? min/max spec? */
    validation?: string | any;
}

export interface ITemplateScriptedInput extends ITemplateComments {
    handler: string;
    params?: any;
}

export interface ITemplateInputs extends ITemplateComments {
    [key: string]: string | ITemplateTypedInput | ITemplateScriptedInput;
}

export interface ICustomInputInterface extends ITemplateComments {
    type: "prompt" | "browser" | "custom";
    handler: string;
    handlerConfig: any;
}

export interface IInputConfig extends ITemplateComments {
    use?: "prompt" | "browser" | ICustomInputInterface;

    /**
     * Specifies a .js file in the .neoman.config/handlers/ directory.
     * Takes the entire IInputConfig as input, and returns a dictionary whose
     * keys will be available to the replace section.
     **/
    handler?: string;

    /** Optional text to show user before prompting. */
    preface?: string;
    
    /** A dictionary with variable names as keys and question definitions as values. */
    define?: ITemplateInputs;
}
import { ITemplateComments } from "./i-template-comments";

export interface IHandlerReference {
    /**
     * A path to a javascript file relative to .neoman.config/handlers.
     */
    handler: string;

    /**
     * Optional and arbitrary parameters to supply to the handler function when calling it.
     */
    params?: any;
}

export interface IInputTransform {
    /**
     * A regular expression string of the form "/[an expression]/".
     */
    match: string,

    /**
     * A replacement string potentially containing substitution keys, e.g.,
     * $1, $2, $3, etc.
     */
    replace: string,

    /**
     * A dictionary of Javascript RegExp substitution keys, e.g., $1, $2, etc.
     * The value for each key can be either a string referencing a library call
     * like "toLowerCase", or an object referencing a relative handler path.
     */
    modify: string | IHandlerReference;
}

export type InputTransform = string | IInputTransform;

export interface ITemplateComplexInput extends ITemplateComments {

    /** A suggested prompt string for the input plugin. */
    prompt: string;

    /** The default value. */
    default?: any;

    /** A regular expression, for now. Later, a handler? min/max spec? */
    validation?: string | any;

    /** Any transformations to apply to the user input. Can be a regular
     * expression string of the form "/start(parts)/end$1/g", or an
     * IInputTransform object.
     */
    transform?: InputTransform;
}

export interface ITemplateDerivedInput extends ITemplateComments {
    derivedFrom: string;

    transform: InputTransform;
}

export type TemplateInput = string | ITemplateComplexInput | IHandlerReference | ITemplateDerivedInput;

export interface ITemplateInputs extends ITemplateComments {
    [key: string]: TemplateInput;
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
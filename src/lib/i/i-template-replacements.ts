export interface ITemplateReplacement {
    /** Whether to treat the token to be replaced as a regex. */
    regex: boolean;

    /** Action file to use once a match is found, regardless of replacement type. */
    action: string;

    /**
     * Configuration to use for replacements. Supplying a language-specific config will
     * run regex/simple matching over this.params.type, only, for example.
     * */
    config: string;

    /** Parameters to supply to configured parser. */
    params: { type: string, [key: string]: any };
}

export interface ITemplateReplacements {
    [key: string]: string | ITemplateReplacement;
}
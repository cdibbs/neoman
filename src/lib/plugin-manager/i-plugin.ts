import { ISubjectDefinition } from "../i/template/i-subject-definition";

export interface IPlugin {
    /**
     * Method called shortly after instantiation with user-provided, plugin-defined options.
     * Called before any calls to transform(...).
     * @param {any} pluginOptions plugin-defined options. Provided in template.json with the
     *              key path '$.configurations.{some-config}.pluginConfig'
     */
    configure(pluginOptions: any): void;

    /**
     * Method to perform transform of original content/path. Returns whole content, not only
     * a replacement value.
     * @param {string} path The path of the file to transform
     * @param {string} original The original content (including any transforms applied to it,
     *        up to this point)
     * @param {string | ISubjectDefinition} subject The subject which was located (often, a
     *        regular expression or a string).
     * @param {string | Function } transformOrTransformer A transform value
     *        or transform function suggested by the configuration.
     * @param {any} pluginOptions Options specific to this transform (as opposed to options
     *        provided to the configure(...) call.)
     */
    transform(
        path: string,
        original: string,
        subject: string | ISubjectDefinition,
        transformOrTransformer: string | ((subj: string) => string),
        pluginOptions: any): string;
}
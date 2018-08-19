import { IInputConfig } from "../../user-extensibility";
import { Transforms } from "./transforms";
import { PathTransforms } from "./path-transforms";
import { IConfigurations } from "./i-configurations";
import { ITemplateComments } from "./i-template-comments";

/**
 * The strict template.json format which excludes the possibility
 * of user-defined keys and comments.
 */
export interface IStrictRawTemplate extends ITemplateComments {
    /**
     * We only require two fields: name and identity. This is enough to identify
     * and run the template (with nothing else specified, it will result in a file copy).
     */
    identity: string;
    
    /**
     * We only require two fields: name and identity. This is enough to identify
     * and run the template (with nothing else specified, it will result in a file copy).
     */
    name: string;

    description?: string;
    author?: string;
    classifications?: string[];
    shortName?: string;
    tags?: {
        keywords: string[];
        language: string;

        [key: string]: string | string[];
    };

    inputs?: IInputConfig;

    transform?: Transforms;

    pathTransform?: PathTransforms;

    files?: string[];

    ignore?: string[];

    configurations?: IConfigurations;

    /**
     * Space reserved for user whims - will always be ignored by core, Neoman tooling.
     * You can use other keys, and, in all probability, we will never try to snatch
     * one like "__ILovePandas__" out from under you. However, this is the only
     * non-comment key where we guarantee we won't. :-)
     * 
     * Note: Plugins should use "configurations" section for their custom settings.
     */
    whims?: any;
}
import { IStrictRawTemplate } from "./i-strict-raw-template";

/**
 * The root template.json format, including the possibility of 
 */
export interface IRawTemplate extends IStrictRawTemplate {
    [key: string]: any;
}
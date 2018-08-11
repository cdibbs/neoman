import { ICapabilities } from "./i-capabilities";
import { INeedy } from "./i-needy";

export interface IHandler extends INeedy {
    (capabilities: ICapabilities, config?: any): any;
}
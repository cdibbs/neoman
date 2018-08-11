import { IHandler } from "./i-handler";
import { ICapabilities } from "./i-capabilities";
import { IInputConfig } from "./i-input-config";

export interface IInputHandler extends IHandler {
    (capabilities: ICapabilities, config?: IInputConfig): { [key: string]: any };
}
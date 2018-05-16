import { IClient } from "./i-client";
import { IInputConfig } from "../../i/template";

export interface IServer {
    launch(
        staticContentPath: string,
        inputConfig: IInputConfig,
        client: IClient
    ): void;
    stop(): void;
}
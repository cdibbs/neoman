import { IClient } from "./i-client";
import { IInputConfig } from "../../user-extensibility";

export interface IServer {
    launch(
        staticContentPath: string,
        inputConfig: IInputConfig,
        client: IClient
    ): void;
    stop(): void;
}
import { IInputConfig } from "../../i/template";

export interface IDuplexer {
    getAnswers(inputConfig: IInputConfig): Promise<{ [key: string]: any }>;
    stop(): void;
}
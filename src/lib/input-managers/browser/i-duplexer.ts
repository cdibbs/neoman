import { IInputConfig } from "../../user-extensibility";

export interface IDuplexer {
    getAnswers(inputConfig: IInputConfig): Promise<{ [key: string]: any }>;
    stop(): void;
}
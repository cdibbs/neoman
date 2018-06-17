import { Server as HttpServer } from "http";

export interface IWebSocket {
    initialize(httpServerInstance: HttpServer): void;
}
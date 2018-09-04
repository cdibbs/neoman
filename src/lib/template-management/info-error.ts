export class InfoError {
    err: Error;
    type: "404" | "500"; // :-)
    message: string;
}
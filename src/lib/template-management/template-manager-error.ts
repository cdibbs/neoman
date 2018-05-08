export class TemplateManagerError {
    constructor(
        public error: Error,
        public file: string)
    {
    }
}
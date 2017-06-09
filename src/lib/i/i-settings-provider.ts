export interface ISettingsProvider {
    get(key: string): string;
    set(key: string, value: string): void;
}
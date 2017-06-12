import { UnionKeyToValue } from '../union-key-to-value';

export type Commands = "NewProject" | "ListTemplates" | "SetDir" | "Info";
export const COMMANDS: UnionKeyToValue<Commands> = {
    NewProject: "NewProject",
    ListTemplates: "ListTemplates",
    SetDir: "SetDir",
    Info: "Info"
}
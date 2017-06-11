export type UnionKeyToValue<U extends string> = {
  [K in U]: K
};

export type Commands = "NewProject" | "ListTemplates" | "SetDir" | "Info";
export const COMMANDS: UnionKeyToValue<Commands> = {
    NewProject: "NewProject",
    ListTemplates: "ListTemplates",
    SetDir: "SetDir",
    Info: "Info"
}
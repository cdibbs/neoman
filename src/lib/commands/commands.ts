export type UnionKeyToValue<U extends string> = {
  [K in U]: K
};

export type Commands = "NewProject" | "ListTemplates" | "SetDir";
export const COMMANDS: UnionKeyToValue<Commands> = {
    NewProject: "NewProject",
    ListTemplates: "ListTemplates",
    SetDir: "SetDir"
}
import { Test } from "alsatian";
import { BaseInputManager } from "./base-input-manager";
import { IInputConfig } from "../i/template";
import { RunOptions } from "../models";
import { Assert } from "alsatian-fluent-assertions";

export class BaseInputManagerTests {
    @Test()
    constructor_setsTemplatePath() {
        const bim = new BogusInputManager();
        const testPath = "/tmp/something";
        bim.configure(testPath)
        Assert(bim)
            .has(o => o["tmplRootPath"])
            .that.equals(testPath);
    }
}

export class BogusInputManager extends BaseInputManager {
    protected tmplRootPath: string;
    configure(tmplRootPath: string): void {
        super.configure(tmplRootPath);
    }
    ask(config: IInputConfig, options: RunOptions): Promise<{ [key: string]: any; }> {
        throw new Error("Method not implemented.");
    }
}
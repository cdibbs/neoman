import { AsyncTest, Setup, TestCase } from "alsatian";
import { Assert } from "alsatian-fluent-assertions";
import { IMock, Mock } from "typemoq";
import { RunOptions } from "../../models";
import { IInputConfig, ITemplateTypedInput } from "../../user-extensibility";
import { ArgvInputManager } from "./argv-input-manager";
var NestedError = require('nested-error-stacks');

export class DefaultsInputManagerTests {
    im: ArgvInputManager;

    @Setup
    public beforeEach() {
    }

    @TestCase({})
    @TestCase(null)
    @TestCase(undefined)
    @AsyncTest("ask() when no questions, returns empty dict.")
    async ask_whenNoQuestions_ReturnsEmpty() {
        var answers = await this.im.ask({}, <RunOptions>{});
        Assert(answers)
            .isEmpty();
    }
}
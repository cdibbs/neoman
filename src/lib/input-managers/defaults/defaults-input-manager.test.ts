import { Test, Setup, Expect, AsyncTest, TestCase } from "alsatian";
import { DefaultsInputManager } from "./defaults-input-manager";
import { IHandlerService } from "../../i";
import { IMock, Mock, Times, It } from "typemoq";
import { RunOptions } from "../../models";
import { IInputConfig, ITemplateTypedInput } from "../../i/template";
import { Assert } from "alsatian-fluent-assertions";
import { IDefaultsAnswerer } from "./i-defaults-answerer";
var NestedError = require('nested-error-stacks');

export class DefaultsInputManagerTests {
    im: DefaultsInputManager;
    answererMock: IMock<IDefaultsAnswerer>;

    @Setup
    public beforeEach() {
        this.answererMock = Mock.ofType<IDefaultsAnswerer>();
        this.im = new DefaultsInputManager(this.answererMock.object);
        this.im["tmplRootPath"] = "something";
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

    @AsyncTest("ask() when questions, iterate and get defaults.")
    async ask_whenQuestions_getDefaultForEach() {
        const inputConfig = <IInputConfig>{
            define: {
                one: "something",
                two: "another thing",
                three: <ITemplateTypedInput>{ default: 123}
            }
        };
        const vals = Object.keys(inputConfig.define).map(k => inputConfig.define[k]);
        vals.map(
            v => this.answererMock
                .setup(x => x.getDefault(v))
                .returns(() => "bogus"));

        var answers = await this.im.ask(inputConfig, <RunOptions>{});
        Assert(answers)
            .hasKeys(Object.keys(inputConfig.define));        
        this.answererMock
            .verifyAll();
    }
}
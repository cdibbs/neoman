import { AsyncTest, Setup, Test, TestCase } from "alsatian";
import { Assert } from "alsatian-fluent-assertions";
import { IMock, It, Mock, Times } from "typemoq";
import { PromptInputManager } from "..";
import { mockMessagerFactory } from "../../../spec-lib";
import { IUserMessager } from "../../i";
import { RunOptions } from "../../models";

export class PromptInputManagerTests {
    im: PromptInputManager;
    userMsgr: IUserMessager;
    processMock: IMock<NodeJS.Process>;
    stdinMock: IMock<NodeJS.ReadStream>;
    stdoutMock: IMock<NodeJS.WriteStream>;

    @Setup
    public beforeEach() {
        this.userMsgr = mockMessagerFactory();

        this.processMock = Mock.ofType<NodeJS.Process>();
        this.stdinMock = Mock.ofType<NodeJS.ReadStream>();
        this.stdoutMock = Mock.ofType<NodeJS.WriteStream>();
        this.processMock.setup(x => x.stdin).returns(() => this.stdinMock.object);
        this.processMock.setup(x => x.stdout).returns(() => this.stdoutMock.object);
        this.im = new PromptInputManager(this.processMock.object, this.userMsgr);
        this.im["tmplRootPath"] = "something";

        Assert(this.im)
            .forReason("class internals must exist")
            .has(x => x["promptWithCallback"])
            .has(x => x["countQuestions"]);
    }

    @TestCase({ one: "one" })
    @TestCase({ one: "one", two: "two" })
    @TestCase({ one: "one", two: "two", three: "three" })
    @AsyncTest("ask() displays question count")
    async ask_displaysQuestionCount(define: any) {
        const inputConfig = {
            define: define
        };
        const runOpts: RunOptions = <any>{ verbosity: "debug" };
        const promptMock = this.setupPromptMock();

        await this.im.ask(inputConfig, runOpts);

        let count = 1, max = Object.keys(define).length;
        for(let key in define) {
            const ptrn = new RegExp(`/\(${count}\/${max}\)/`).compile();
            promptMock.verify(m => m(key, It.is(t => ptrn.test(t)), It.isAny(), It.isAny()), Times.once());
        }
    }

    @TestCase(null, {})
    @TestCase(undefined, {})
    @TestCase({ one: "question" }, { one: "answer"} )
    @AsyncTest("ask() if definition set valid, iterates, otherwise returns empty")
    async ask_iteratesValidDefinitionOrReturnsEmpty(define: any, expectedResult: any) {
        const inputConfig = {
            define: define
        };
        const runOpts: RunOptions = <any>{ verbosity: "debug" };
        const promptMock = this.setupPromptMock();

        const answers = await this.im.ask(inputConfig, runOpts);

        Assert(answers).deeplyEquals(expectedResult);
    }

    @TestCase("some text")
    @TestCase("some different text")
    @AsyncTest("ask() prompts with correct text")
    async ask_callsPromptWithCorrectText(text: string) {
        const inputConfig = {
            define: {
                key: text
            }
        };
        const runOpts: RunOptions = <any>{ verbosity: "debug" };
        const promptMock = this.setupPromptMock();
        const regexp = new RegExp(text).compile();

        const answers = await this.im.ask(inputConfig, runOpts);
        promptMock.verify(x => x("key", It.is(t => regexp.test(t)), It.isAny(), It.isAny()), Times.once());
    }

    @Test("promptWithCallback() errors with a Not Yet Supported message for invalid question types")
    _promptWithCallback_errorsNotYetSupportedForInvalidQuestionTypes() {
        const key = "future!";
        const question = { something: "more complicated" };
        const callbackMock = Mock.ofInstance((data: any) => {});
        const errorCbMock = Mock.ofInstance((err: Error) => {});

        this.im["promptWithCallback"](key, <any>question, callbackMock.object, errorCbMock.object);

        callbackMock.verify(x => x(It.isAny()), Times.never());
        errorCbMock.verify(x => x(It.is(e => /not supported/.test(e.message))), Times.once())
    }

    @Test("promptWithCallback() outputs text and calls callback with read data")
    _promptWithCallback_outputsAndCallsCallbackWithData() {
        const key = "normal";
        const question = "question text";
        const callbackMock = Mock.ofInstance((t: string) => {});
        const errorCbMock = Mock.ofInstance((err: Error) => {});
        const inputText = "somethign teh user typoed";
        this.stdinMock // fake user input
            .setup(i => i.once('data', It.isAny()))
            .callback((d, cb) => cb(inputText));

        this.im["promptWithCallback"](key, <any>question, callbackMock.object, errorCbMock.object);

        errorCbMock.verify(x => x(It.isAny()), Times.never());
        this.stdoutMock.verify(o => o.write(question, It.isAny()), Times.once())
        this.stdinMock.verify(i => i.once('data', It.isAny()), Times.once());
        callbackMock.verify(x => x(inputText), Times.once());
    }

    @Test("countQuestions() throws when question section not recognized")
    _countQuestions_throwsWhenNotRecognized() {
        const testFn = () => this.im["countQuestions"](<any>123 /* invalid section format */);
        Assert(testFn)
            .throws()
            .that.has(e => e.message)
            .that.matches(/Unrecognized input section format/);
    }

    protected setupPromptMock(): IMock<(a: string, b: string, c: Function, d: Function) => Promise<any>> {
        const promptMock = Mock.ofInstance((key: string, qtext: string, res: any, rej: any) => { return Promise.resolve()});
        promptMock
            .setup(x => x(It.isAny(), It.isAny(), It.isAny(), It.isAny()))
            .callback((a,b,res,rej) => res("answer"));
        this.im["promptWithCallback"] = promptMock.object;
        return promptMock;
    }
}
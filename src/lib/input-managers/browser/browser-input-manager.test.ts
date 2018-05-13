import { BrowserInputManager } from "./browser-input-manager";
import { mockMessagerFactory } from "../../../spec-lib/typemoq-messager";
import { IPath } from "../../i";
import { IMock, Mock, It, ExpectedCallType, Times } from "typemoq";
import { Setup, Test, AsyncTest, TestCase } from "alsatian";
import { IDuplexer } from "./i-duplexer";
import { RunOptions } from "../../models";
import { Assert } from "alsatian-fluent-assertions";

export class BrowserInputManagerTest {
    browserInputManager: BrowserInputManager;
    mockDuplexer: IMock<IDuplexer>;

    @Setup
    public beforeEach() {
        this.mockDuplexer = Mock.ofType<IDuplexer>();
        this.browserInputManager = new BrowserInputManager(mockMessagerFactory(), this.mockDuplexer.object);
    }

    @TestCase("resolve", true)
    @TestCase("reject", false)
    @AsyncTest()
    public async ask_stopsDuplexerUponAnswersForConfigAndReturnsAnswers(resolution: string, expectAnswers: boolean) {
        // Setup
        const config = {};
        const runOpts = {};
        const answers = { whoa: 123 };
        let msetup = this.mockDuplexer.setup(m => m.getAnswers(config));
            msetup.returns(() => Promise[resolution](answers));
            msetup.verifiable(Times.once(), ExpectedCallType.InSequence);
        this.mockDuplexer
            .setup(m => m.stop())
            .verifiable(Times.once(), ExpectedCallType.InSequence);

        // Test
        let result: { [key: string]: any };
        const lambda = async () => {
            result = await this.browserInputManager.ask(config, <RunOptions> runOpts);
        };
        await Assert(lambda)
            .maybe(!expectAnswers)
            .throwsAsync();

        // Verify
        this.mockDuplexer.verifyAll();
        Assert(result)
            .maybe(expectAnswers)
            .deepStrictlyEquals(answers);
    }
}
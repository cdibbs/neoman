import { AsyncTest, Setup, Test, TestCase } from "alsatian";
import { Assert } from "alsatian-fluent-assertions";
import { IMock, It, Mock, Times } from "typemoq";
import { BrowserInputManager, CustomInputManager, DefaultsInputManager, InputManager, PromptInputManager } from ".";
import { mockMessagerFactory } from "../../spec-lib";
import { UserMessager } from "../integrations";
import { RunOptions } from "../models";
import { IInputConfig } from "../user-extensibility";
var NestedError = require('nested-error-stacks');

export class InputManagerTests {
    pimMock: IMock<PromptInputManager>;
    bimMock: IMock<BrowserInputManager>;
    cimMock: IMock<CustomInputManager>;
    dimMock: IMock<DefaultsInputManager>
    userMsgr: UserMessager;
    im: InputManager;

    @Setup
    beforeEach() {
        this.pimMock = Mock.ofType<PromptInputManager>();
        this.bimMock = Mock.ofType<BrowserInputManager>();
        this.cimMock = Mock.ofType<CustomInputManager>();
        this.dimMock = Mock.ofType<DefaultsInputManager>();
        this.userMsgr = mockMessagerFactory();
        this.im = new InputManager(this.pimMock.object, this.bimMock.object, this.cimMock.object, this.dimMock.object, this.userMsgr);
    }

    @AsyncTest("ask() should return an empty dictionary on undefined input configuration")
    async ask_returnEmptyWhenNoInputConfig() {
        const result = await this.im.ask(undefined, null);
        this.pimMock.verify(p => p.ask(It.isAny(), It.isAny()), Times.never())
        this.cimMock.verify(p => p.ask(It.isAny(), It.isAny()), Times.never())
        this.dimMock.verify(p => p.ask(It.isAny(), It.isAny()), Times.never())
        this.bimMock.verify(p => p.ask(It.isAny(), It.isAny()), Times.never())
        Assert(result).deeplyEquals(<any>{});
    }

    @TestCase({ })
    @TestCase({ use: "prompt" })
    @TestCase({ use: { type: "prompt" } })
    @AsyncTest("ask() should use prompt manager, if ui type undefined, or when specified")
    async ask_ifUiTypeUndefined_usePromptManager(ic: IInputConfig) {
        const testData = { whoa: 123 };
        this.pimMock.setup(m => m.ask(It.isAny(), It.isAny())).returns(async () => testData);
        const result = await this.im.ask(ic, null);

        Assert(result).deeplyEquals(<any>testData);
        this.pimMock.verify(m => m.ask(ic, null), Times.once());
        this.cimMock.verify(p => p.ask(It.isAny(), It.isAny()), Times.never());
        this.dimMock.verify(p => p.ask(It.isAny(), It.isAny()), Times.never());
        this.bimMock.verify(p => p.ask(It.isAny(), It.isAny()), Times.never());
    }

    @TestCase({ use: "browser" })
    @TestCase({ use: { type: "browser" } })
    @AsyncTest("ask() should use browser when specified")
    async ask_useBrowserWhenSpecified(ic: IInputConfig) {
        const testData = { whoa: 123 };
        this.bimMock.setup(m => m.ask(It.isAny(), It.isAny())).returns(async () => testData);
        const result = await this.im.ask(ic, null);

        Assert(result).deeplyEquals(<any>testData);
        this.bimMock.verify(m => m.ask(ic, null), Times.once());
        this.cimMock.verify(p => p.ask(It.isAny(), It.isAny()), Times.never());
        this.dimMock.verify(p => p.ask(It.isAny(), It.isAny()), Times.never());
        this.pimMock.verify(p => p.ask(It.isAny(), It.isAny()), Times.never());
    }

    @AsyncTest("ask() should use defaults when specified by run options")
    async ask_useDefaultsByDefault() {
        const ic = {}; const runOpts = { defaults: true };
        const testData = { whoa: 123 };
        this.dimMock.setup(m => m.ask(It.isAny(), It.isAny())).returns(async () => testData);
        const result = await this.im.ask(ic, <RunOptions> runOpts);

        Assert(result).deeplyEquals(<any>testData);
        this.dimMock.verify(m => m.ask(ic, <RunOptions>runOpts), Times.once());
        this.cimMock.verify(p => p.ask(It.isAny(), It.isAny()), Times.never());
        this.bimMock.verify(p => p.ask(It.isAny(), It.isAny()), Times.never());
        this.pimMock.verify(p => p.ask(It.isAny(), It.isAny()), Times.never());
    }
    
    @AsyncTest("ask() assume custom when unknown type")
    async ask_assumeCustomWhenTypeUnknown() {
        const ic = <IInputConfig> { use: { type: "handler", handler: "weird", params: "" } };
        const testData = { whoa: 123 };
        this.cimMock.setup(m => m.ask(It.isAny(), It.isAny())).returns(async () => testData);
        const result = await this.im.ask(ic, null);

        Assert(result).deeplyEquals(<any>testData);
        this.cimMock.verify(m => m.ask(ic, null), Times.once());
        this.bimMock.verify(p => p.ask(It.isAny(), It.isAny()), Times.never());
        this.dimMock.verify(p => p.ask(It.isAny(), It.isAny()), Times.never());
        this.pimMock.verify(p => p.ask(It.isAny(), It.isAny()), Times.never());
    }
    
    @AsyncTest("ask() should error when 'use' format not recognized")
    async ask_errorWhenUnrecognizedUseFormat() {
        const ic = { use: 123 };
        (await Assert(async () => await this.im.ask(<any>ic, null))
            .throwsAsync())
            .that.has(m => m.message)
            .that.matches(/Unrecognized/);
        this.pimMock.verify(p => p.ask(It.isAny(), It.isAny()), Times.never());
        this.bimMock.verify(p => p.ask(It.isAny(), It.isAny()), Times.never());
        this.dimMock.verify(p => p.ask(It.isAny(), It.isAny()), Times.never());
        this.cimMock.verify(p => p.ask(It.isAny(), It.isAny()), Times.never());
    }

    @AsyncTest("ask() should trap and wrap unexpected errors")
    async ask_trapsAndWrapsUnexpectedErrors() {
        const ic: IInputConfig = { use: "prompt" };
        const err = new Error();
        this.pimMock
            .setup(m => m.ask(It.isAny(), It.isAny()))
            .throws(err);
        
        (await Assert(async() => await this.im.ask(ic, null))
            .throwsAsync())
            .that
                .is(NestedError)
                .has(e => e.message).that.matches(/Unexpected/);

        this.bimMock.verify(p => p.ask(It.isAny(), It.isAny()), Times.never());
        this.dimMock.verify(p => p.ask(It.isAny(), It.isAny()), Times.never());
        this.cimMock.verify(p => p.ask(It.isAny(), It.isAny()), Times.never());
    }

    @Test("_generateDefaults() creates interface description for simple config")
    _generateDefaults_createsInterfaceDescriptionOfCorrectType() {
        const result = this.im["generateDefaults"]("strung");
        Assert(result)
            .has(r => r.type)
            .that.equals(<any>"strung");
    }
}
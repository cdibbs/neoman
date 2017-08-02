/// <reference path="../../../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../../../node_modules/@types/chai/index.d.ts" />
import "reflect-metadata";
import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as sinon from 'sinon';
chai.use(chaiAsPromised);
let expect = chai.expect, assert = chai.assert;

import * as i from '../i';
import { InputManager, PromptInputManager, CustomInputManager, BrowserInputManager } from './index';
import { mockPathFactory, mockMessagerFactory } from '../../spec-lib';

describe(InputManager.name, () => {
    let im: InputManager;
    let mytmp: string;
    let pask: sinon.SinonStub, bask: sinon.SinonStub, cask: sinon.SinonStub, cconf: sinon.SinonStub;
    let pim: PromptInputManager, bim: BrowserInputManager, cim: CustomInputManager;

    beforeEach(() => {
        mytmp = "/my/tmp";
        pask = sinon.stub(), bask = sinon.stub(), cask = sinon.stub();
        cconf = sinon.stub();
        pim = <any>{ ask: pask };
        bim = <any>{ ask: bask };
        cim = <any>{ ask: cask, configure: cconf };

        im = new InputManager(pim, bim, cim);
        im.configure(mytmp);
    });

    describe('#ask', () => {
        let gstub: sinon.SinonStub;
        beforeEach(() => {
            gstub = sinon.stub();
            im["generateDefaults"] = gstub;
        });

        it('should use prompt manager, if ui type undefined', () => {
            let config = {};
            let answers = { hoha: "me" };
            pask.returns(Promise.resolve(answers));

            return im["ask"](config).then(res => {
                sinon.assert.calledWith(pask, config);
                expect(res).to.deep.equal(answers);
            });
        });

        it('should use browser prompt when specified', () => {
            let config = { use: "browser" };
            let answers = { hoha: "me" };
            gstub.returns({ type: "browser" });
            bask.returns(Promise.resolve(answers));

            return im["ask"](<any>config).then(res => {
                sinon.assert.calledWith(gstub, config.use);
                sinon.assert.calledWith(bask, config);
                expect(res).to.deep.equal(answers);
            });
        });

        it('should use stdin prompt when specified', () => {
            let config = { use: "prompt" };
            let answers = { hoha: "me" };
            gstub.returns({ type: "prompt" });
            pask.returns(Promise.resolve(answers));

            return im["ask"](<any>config).then(res => {
                sinon.assert.calledWith(gstub, config.use);
                sinon.assert.calledWith(pask, config);
                expect(res).to.deep.equal(answers);
            });
        });

        it('should use custom when not browser or prompt', () => {
            let config = { use: { type: "im different!" } };
            let answers = { hoha: "me" };
            im["tmplRootPath"] = "/tmp/whoa";
            cask.returns(Promise.resolve(answers));

            return im["ask"](<any>config).then(res => {
                sinon.assert.calledWith(cconf, "/tmp/whoa");
                sinon.assert.calledWith(cask, config);
                expect(res).to.deep.equal(answers);
            });
        });

        it('should error when use format not recognized', () => {
            let config = { use: 123 };

            expect(im["ask"](<any>config)).to.be.rejectedWith("Unrecognized");
        });

        it('should trap and wrap any unexpected errors', () => {
            let config = { use: "prompt" };
            let answers = { hoha: "me" };
            gstub.returns({ type: "prompt" });
            pask.throws(new Error("you had ooone thing to do"));

            return im["ask"](<any>config).catch(err => {
                sinon.assert.calledWith(pask, config);
                expect(err).to.have.property("message").which.contains("Unexpected error").and.contains("prompt");
            });
        });
    });

    describe('#generateDefaults', () => {
        it('should create a interface description of the right type', () => {
            let result = im["generateDefaults"]("strung");
            expect(result.type).to.equal("strung");
        });
    });
});
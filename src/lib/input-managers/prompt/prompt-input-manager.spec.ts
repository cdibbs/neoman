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
import { PromptInputManager, CustomInputManager, BrowserInputManager } from './index';
import { mockPathFactory, mockMessagerFactory,  } from '../../spec-lib';

describe(PromptInputManager.name, () => {
    let im: PromptInputManager;
    let mytmp: string;
    let pask: sinon.SinonStub, bask: sinon.SinonStub, cask: sinon.SinonStub, cconf: sinon.SinonStub;
    let proc: NodeJS.Process;

    beforeEach(() => {
        mytmp = "/my/tmp";
        cconf = sinon.stub();

        im = new PromptInputManager(proc, mockMessagerFactory());
        im.configure(mytmp);
    });

    describe('#ask', () => {
        let gstub: sinon.SinonStub;
        beforeEach(() => {
            gstub = sinon.stub();
            im["generateDefaults"] = gstub;
        });


    });
});
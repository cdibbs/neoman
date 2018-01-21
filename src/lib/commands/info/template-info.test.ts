// 3rd party imports installed via npm install
import { Test, TestFixture, AsyncTest, TestCase, AsyncSetup, AsyncTeardown, Expect } from 'alsatian';
import * as sinon from 'sinon';
import { Command } from "commandpost";
import * as TypeMoq from "typemoq";

// internal imports (always a relative path beginning with a ./ or ../)
import * as i from '../../i';
import * as nci from '../i';
import { ITemplate } from '../../i/template';
import { mockMessagerFactory } from '../../../spec-lib'
import { InfoCommand } from './info-command';
import { ErrorReporter } from '../../error-reporter';

@TestFixture("Template info service tests")
export class TemplateInfoTests {
    ic: InfoCommand;
    cmdDef: Command<any, any>;
    tmplMgrStub: sinon.SinonStub;
    errRepMock: TypeMoq.IMock<i.IErrorReporter>;
    infoNoop: sinon.SinonSpy;

    @AsyncSetup
    public async beforeEach() {
        this.errRepMock = TypeMoq.Mock.ofType<i.IErrorReporter>(ErrorReporter);
    }

    @AsyncTeardown
    public async afterEach() {

    }
}
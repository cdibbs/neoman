// 3rd party imports installed via npm install
import { Test, TestFixture, AsyncTest, TestCase, AsyncSetup, AsyncTeardown, Expect, Teardown, Setup } from 'alsatian';
import * as sinon from 'sinon';

import { ErrorReporter } from './error-reporter';
import { IUserMessager } from './i';

import { mockMessagerFactory } from "../spec-lib";

@TestFixture("Error Reporter tests")
export class ErrorReporterTests {
    msgr: IUserMessager
    reporter: ErrorReporter;

    @Setup
    public beforeEach() {
        this.msgr = mockMessagerFactory();
        this.reporter = new ErrorReporter(this.msgr);
    }

    @TestCase({ stack: "mystacktrace" }, "mystacktrace")
    @TestCase("simplemessage", "simplemessage")
    @Test("should show stack when appropriate.")
    reportError_showStackOrNot(err: Error | string, expMsg: string) {
        let spy = sinon.spy();
        this.msgr.error = spy;

        this.reporter.reportError(err);

        sinon.assert.calledWith(spy, expMsg);
    }
}
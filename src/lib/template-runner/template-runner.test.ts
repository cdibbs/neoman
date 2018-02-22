import { Test, TestFixture, AsyncTest, TestCase, TestCases, AsyncSetup, AsyncTeardown, Expect, Teardown, Setup } from 'alsatian';
import { Mock, IMock, It, Times } from 'typemoq';
import * as c from 'commandpost';

import { Levels, LEVELS, Ii18nFunction, IUserMessager, IFileSystem } from './i';
import { TemplateRunner } from './template-runner';

@TestFixture("Template Runner Tests")
export class TemplateRunnerTests {
    i18nMock: IMock<Ii18nFunction>;
    writeMock: IMock<(s: string, n: number, l: Levels) => IUserMessager>;
    trunner: TemplateRunner;
    msgrMock: IMock<IUserMessager>;
    fsMock: IMock<IFileSystem>;

    @Setup
    public beforeEach() {
        this.msgrMock = Mock.ofType<IUserMessager>();
        this.fsMock = Mock.ofType<IFileSystem>();

        this.trunner = new TemplateRunner(this.msgrMock.object, this.fsMock.object, this.pathMock.object, this.patternsMock.object,
            this.imMock.object, this.tmMock.object, this.ptmMock.object, this.validatorMock.object);
    }

    @TestCase("info", LEVELS.Info)
    @TestCase("debug", LEVELS.Debug)
    @TestCase("warn", LEVELS.Warn)
    @TestCase("error", LEVELS.Error)
    @Test("helpers - called with correct levels.")
    public level_writesWithCorrectLevels(method: string, level: Levels) {
        this.msgr["write"] = this.writeMock.object;
        this.msgr[method]("something");
        this.writeMock.verify(w => w("something", undefined, level), Times.once());
    }

    @TestCase(LEVELS.Info, "log")
    @TestCase(LEVELS.Debug, "log")
    @TestCase(LEVELS.Warn, "warn")
    @TestCase(LEVELS.Error, "error")
    @Test("write - uses correct console method.")
    public write_usesCorrectMethod(level: Levels, method: string) {
        this.msgr.write("something", 0, level);
        this.consoleMock.verify(c => c[method]("something"), Times.once());
    }
    
    @Test("write - returns self.")
    public write_returnsSelf() {
        let result = this.msgr.write("something");
        Expect(result).toBeDefined();
        Expect(result).toEqual(this.msgr);
    }

    @TestCase(false, 0)
    @TestCase(true, 1)
    @Test("write - formats message with i18n when use i18n.")
    public write_formatsMessageWithi18n_whenUsei18n(usei18n: boolean, _mfCalls: number) {
        this.msgr = new UserMessager(this.i18nMock.object, null, usei18n);
        this.msgr["console"] = this.consoleMock.object;
        this.msgr.write("something");
        this.i18nMock.verify(i => i("something", It.isAny()), Times.exactly(_mfCalls));
    }

    @Test("write - throws on bad log level.")
    public write_throwsOnBadLogLevel() {
        let err = "formatted error message";
        this.i18nMock.setup(i => i(It.isAnyString(), It.isAny())).returns(() => err);
        Expect(() => this.msgr.write("something", 0, <Levels>"bogus")).toThrowError(Error, err);
    }

    @Test("i18n - returns new instance of self with i18n enabled.")
    public i18n_returnsSelfWithi18nEnabled() {
        let mybag = { "what": "is this" };
        let result = this.msgr.i18n(mybag);
        Expect(result).toBeDefined();
        Expect(result instanceof UserMessager).toBeTruthy();
        Expect(result["mfDict"]).toEqual(mybag);
        Expect(result["usei18n"]).toBeTruthy();
    }

    @Test("mf - should pass correct state to i18n __mf library call.")
    public mf_passesCorrectState() {
        let mybag = { "new": "state" };
        let imsgr = this.msgr.i18n(mybag);
        imsgr.mf("some thing");
        this.i18nMock.verify(i => i("some thing", mybag), Times.once());
    }
}
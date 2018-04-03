import { Test, TestFixture, AsyncTest, TestCase, TestCases, AsyncSetup,
    AsyncTeardown, Teardown, Setup, Expect as OldExpect,
    FluentExpect as Expect
} from 'alsatian';
import { Mock, IMock, It, Times } from 'typemoq';
import * as c from 'commandpost';

import { IFSTreeProcessor } from './i';
import { Levels, LEVELS, Ii18nFunction, IUserMessager, IFileSystem, ITemplateValidator, IInputManager } from '../i';
import { TemplateRunner } from './template-runner';
import { CommandErrorType } from "../models";
import { mockMessagerFactory } from '../../spec-lib';

@TestFixture("Template Runner Tests")
export class TemplateRunnerTests {
    i18nMock: IMock<Ii18nFunction>;
    writeMock: IMock<(s: string, n: number, l: Levels) => IUserMessager>;
    trunner: TemplateRunner;
    fsMock: IMock<IFileSystem>;
    fsTreeProcMock: IMock<IFSTreeProcessor>;
    imMock: IMock<IInputManager>;
    validatorMock: IMock<ITemplateValidator>;
    msgr: IUserMessager;

    @Setup
    public beforeEach() {
        this.msgr = mockMessagerFactory();
        this.fsMock = Mock.ofType<IFileSystem>();
        this.fsTreeProcMock = Mock.ofType<IFSTreeProcessor>();
        this.imMock = Mock.ofType<IInputManager>();
        this.validatorMock = Mock.ofType<ITemplateValidator>();

        this.trunner = new TemplateRunner(this.msgr, this.fsMock.object,
            this.imMock.object, this.validatorMock.object, this.fsTreeProcMock.object);
    }

    @AsyncTest("run - returns validation error.")
    public async run_returnsValidationError() {
        this.validatorMock
            .setup(m => m.dependenciesInstalled(It.isAny()))
            .returns(() => { return { "somedep": false }; })

        let result = await this.trunner.run("", <any>{}, <any>{});

        Expect(result).with.properties({
            ErrorType: CommandErrorType.SystemState,
            Message: r => Expect(r).to.match(/configuration not valid/)
        });
    }

    @AsyncTest("run - returns validation error re: non-empty destination")
    public async run_returnsValidationErrorOnNonEmpty() {
        this.fsMock.setup(m => m.readdirSync(It.isAnyString())).returns(() => [ "not empty" ]);
        let result = await this.trunner.run("", <any>{}, <any>{});
        Expect(result).with.properties({
            ErrorType: CommandErrorType.SystemState,
            Message: m => Expect(m).to.beDefined()
        });
    }
}
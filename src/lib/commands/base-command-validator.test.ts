// 3rd party imports installed via npm install
import { Test, TestFixture, AsyncTest, TestCase, AsyncSetup, AsyncTeardown, Teardown, Setup } from 'alsatian';
import { Command } from "commandpost";
import * as TypeMoq from "typemoq";
import { It, Times } from 'typemoq';
import { Assert } from 'alsatian-fluent-assertions';

// internal imports (always a relative path beginning with a ./ or ../)
import { IUserMessager, IErrorReporter, IPath, ITemplateRunner, ISettingsProvider } from '../i';
import { mockMessagerFactory } from '../../spec-lib'
import { CommandResult, CommandValidationResult, RunnerResult, CommandErrorType } from '../models';
import { BaseCommandValidator } from './base-command-validator';


@TestFixture("Base command validator tests")
export class BaseCommandValidatorTests {
    cmdDef: Command<any, any>;
    settingsProviderMock: TypeMoq.IMock<ISettingsProvider>;
    c: BaseCommandValidator<any, any>;

    @AsyncSetup
    public async beforeEach() {
        this.cmdDef = <any>{ helpText: () => "" };
        this.settingsProviderMock = TypeMoq.Mock.ofType<ISettingsProvider>();
        this.settingsProviderMock.setup(m => m.get(It.isAnyString())).returns(() => "/tmp/neoman-unit-tests")
        this.c = new BaseCommandValidator(mockMessagerFactory(), this.settingsProviderMock.object, <any>{});
        this.c.tempDir = "/tmp/mytemplates";
    }

    @Teardown
    public async afterEach() {

    }

    @TestCase("/tmp/mytemplates", false)
    @TestCase(undefined, true)
    @TestCase(null, true)
    @TestCase("", true)
    @TestCase("   ", true)
    @AsyncTest('validate - returns templateDir error only when no templateDir.')
    public async validate_returnsTmplDirErrorOnlyWhenNoTmplDir(dir: string, has: boolean) {
        this.c.tempDir = dir;
        var result = await this.c.validate(this.cmdDef, <any>{}, <any>{});
        Assert(result)
            .is(CommandValidationResult)
            .has(r => r.Messages)
            .that.maybe(has).hasElements([ /You have not set a template directory. Please run setdir/ ]);
    }
}
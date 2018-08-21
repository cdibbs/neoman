// 3rd party imports installed via npm install
import { AsyncSetup, AsyncTest, Teardown, TestCase, TestFixture } from 'alsatian';
import { Assert } from 'alsatian-fluent-assertions';
import { Command } from "commandpost";
import * as TypeMoq from "typemoq";
import { It } from 'typemoq';
import { mockMessagerFactory } from '../../../spec-lib';
import { ISettingsProvider } from '../../i';
import { CommandValidationResult } from '../../models';
import { NewCommandValidator } from './new-command-validator';

@TestFixture("New command validator tests")
export class NewCommandValidatorTests {
    cmdDef: Command<any, any>;
    settingsProviderMock: TypeMoq.IMock<ISettingsProvider>;
    c: NewCommandValidator;

    @AsyncSetup
    public async beforeEach() {
        this.cmdDef = <any>{ helpText: () => "" };
        this.settingsProviderMock = TypeMoq.Mock.ofType<ISettingsProvider>();
        this.settingsProviderMock.setup(m => m.get(It.isAnyString())).returns(() => "/tmp/neoman-unit-tests")
        this.c = new NewCommandValidator(mockMessagerFactory(), this.settingsProviderMock.object);
        this.c.tempDir = "/tmp/mytemplates";
    }

    @Teardown
    public async afterEach() {

    }

    @TestCase({ templateId: "my-id" }, false)
    @TestCase({ templateId: "  " }, true)
    @TestCase({ templateId: null }, true)
    @TestCase({ templateId: undefined }, true)
    @TestCase({ }, true)
    @AsyncTest('validate - returns id error only when given no id.')
    public async validate_returnsIdErrorOnlyWhenGivenNoId(args: any, has: boolean) {
        var result = await this.c.validate(this.cmdDef, <any>{}, args);
        Assert(result)
            .is(CommandValidationResult)
            .has(r => r.Messages)
            .that.maybe(has).hasElements([ /You must specify a template identifier./ ]);
    }
}
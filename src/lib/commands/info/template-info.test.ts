// 3rd party imports installed via npm install
import { Test, TestFixture, AsyncTest, TestCase, AsyncSetup, AsyncTeardown } from 'alsatian';
import { Command } from "commandpost";
import * as TypeMoq from "typemoq";
import { It } from "typemoq";

// internal imports (always a relative path beginning with a ./ or ../)
import * as i from '../../i';
import * as nci from '../i';
import { ITemplate } from '../../i/template';
import { mockMessagerFactory } from '../../../spec-lib'
import { InfoCommand } from './info-command';
import { ErrorReporter } from '../../error-reporter';
import { TemplateInfo } from './template-info';
import { TemplateValidator } from '../../template-validator';
import { UserMessager } from '../../user-messager';
import { Assert } from 'alsatian-fluent-assertions';

@TestFixture("Template info service tests")
export class TemplateInfoTests {
    errRepMock: TypeMoq.IMock<i.IErrorReporter>;
    tmplValidMock: TypeMoq.IMock<i.ITemplateValidator>;
    msgrMock: TypeMoq.IMock<i.IUserMessager>;
    tmplInfo: TemplateInfo;

    @AsyncSetup
    public async beforeEach() {
        this.errRepMock = TypeMoq.Mock.ofType<i.IErrorReporter>(ErrorReporter);
        this.tmplValidMock = TypeMoq.Mock.ofType<i.ITemplateValidator>(TemplateValidator);
        this.msgrMock = TypeMoq.Mock.ofType<i.IUserMessager>(UserMessager);
        this.tmplInfo = new TemplateInfo(this.tmplValidMock.object, this.msgrMock.object);
    }

    @AsyncTeardown
    public async afterEach() {

    }

    @Test("should handle empty properties without error")
    public showTemplateInfo_handlesEmptyProps(): void {
        Assert(() => this.tmplInfo.showTemplateInfo(<any>{}))
            .not.throws();            
    }

    @Test("should handle empty dependency result properties without error")
    public showTemplateInfo_handlesEmptyDependencyResultProperties(): void {
        var mresult = [{ dep: "one", installed: false}, { dep: "two", installed: true }, {}];
        this.tmplInfo["dependencies"] = (): any => mresult;
        Assert(() => this.tmplInfo.showTemplateInfo(<any>{}))
            .not.throws();            
    }

    // TODO: Convert error reporting to separate class.
    @Test("should return array of dependencies from validator.")
    public dependencies_returnsArrayOfDependencies() {
        let mresult = { "one": true, "two":false};
        this.tmplValidMock
            .setup<{[key: string]: boolean}>(m => m.dependenciesInstalled(It.isAny()))
            .returns(() => mresult);

        let result = this.tmplInfo.dependencies(<ITemplate>{});
        Assert(result)
            .has({ length: 2 })
            .hasElements([
                { dep: "one", installed: true },
                { dep: "two", installed: false }
            ]);
    }
}
// 3rd party imports installed via npm install
import { Test, TestFixture, AsyncTest, TestCase, AsyncSetup, AsyncTeardown, Expect, Teardown, Setup } from 'alsatian';
import { Command } from "commandpost";
import * as TypeMoq from "typemoq";
import { It, Times } from 'typemoq';
import * as _ from "lodash";

// internal imports (always a relative path beginning with a ./ or ../)
import * as i from '../../i';
import * as nci from '../i';
import { ITemplate } from '../../i/template';
import { mockMessagerFactory } from '../../../spec-lib'
import { ListCommand } from './list-command';
import { ErrorReporter } from '../../error-reporter';
import * as glob from 'glob';
import { IGlobFactory } from '../../util/i-glob-factory';
import { GlobFactory } from '../../util/glob-factory';
import { UserMessager } from '../../user-messager';
import { MockBehavior } from 'typemoq';

@TestFixture("List command tests")
export class ListCommandTests {
    cmdDef: Command<any, any>;
    globMock: TypeMoq.IMock<glob.IGlob>;
    globFactoryMock: TypeMoq.IMock<IGlobFactory>;
    msgrMock: TypeMoq.IMock<i.IUserMessager>;
    c: ListCommand;
    tmplMgrStub: sinon.SinonStub;
    errRepMock: TypeMoq.IMock<i.IErrorReporter>;
    infoNoop: sinon.SinonSpy;

    @AsyncSetup
    public async beforeEach() {
        this.cmdDef = <any>{ help: () => "" };
        this.globMock = TypeMoq.Mock.ofInstance(new glob.Glob(""));
        this.globFactoryMock = TypeMoq.Mock.ofType<IGlobFactory>(GlobFactory);
        this.globFactoryMock
            .setup(m => m.build(It.isAnyString(), It.isAny()))
            .returns(() => this.globMock.object);
        this.msgrMock = TypeMoq.Mock.ofType<i.IUserMessager>(UserMessager);
        this.c = new ListCommand(mockMessagerFactory(), <NodeJS.Process>{}, <i.IFileSystem>{ }, <i.IPath>{}, this.globFactoryMock.object);
        this.c.tempDir = "/tmp/mytemplates";

        this.errRepMock = TypeMoq.Mock.ofType<i.IErrorReporter>(ErrorReporter);
        this.cmdDef = <any>{ help: () => "" };
        /*let vstub = sinon.stub();
        vstub.returns([]);
        this.ic["validator"].dependenciesInstalled = vstub;

        this.infoNoop = sinon.spy();
        this.tmplMgrStub = sinon.stub();

        this.ic["tempDir"] = "noop";
        this.ic["tmplMgr"].info = this.tmplMgrStub;
        this.ic["showTemplateInfo"] = this.infoNoop;*/
    }

    @Teardown
    public async afterEach() {

    }

    @AsyncTest('should set the Glob to use tempDir, and bind match and end')
    public async runValidated_globShouldUseTempDir() {
        //let onSpy = sinon.spy(), bindStub = sinon.stub();
        //let globStub = sinon.stub();
        //globStub.returns({ on: onSpy});
        this.globMock.setup(m => m.on("match", this.c.match));
        this.globMock.setup(m => m.on("end", this.c.end));
        //bindStub.withArgs(c.match).returns(c.match);
        //bindStub.withArgs(c.end).returns(c.end);

        //c["glob"].Glob = <any>globStub;
        //c["bind"] = bindStub;
        let opts = {}, args = {};
        let result = this.c.runValidated(opts, args);
        this.globFactoryMock.verify(m => m.build(this.c.neomanPath, { cwd: this.c.tempDir }), TypeMoq.Times.once());
        // FIXME: precisely match second params
        this.globMock.verify(m => m.on("match", It.isAny()), TypeMoq.Times.once());
        this.globMock.verify(m => m.on("end",It.isAny()), TypeMoq.Times.once());
    }
}
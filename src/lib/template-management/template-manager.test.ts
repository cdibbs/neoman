
import { AsyncTest, Setup, TestFixture } from 'alsatian';
import { IMock, Mock } from 'typemoq';
import { IFileSystem, IGlob, IPath, ISettingsProvider, IUserMessager } from "../../../src/lib/i";
import { mockMessagerFactory } from '../../../src/spec-lib';
import { ISearchHandlerFactory } from './i-search-handler-factory';
import { TemplateManager } from './template-manager';

@TestFixture("Test Fixture Name")
export class ClassNameTests {
    msgr: IUserMessager;
    inst: TemplateManager;
    settingsMock: IMock<ISettingsProvider>;
    fsMock: IMock<IFileSystem>;
    pathMock: IMock<IPath>;
    procMock: IMock<NodeJS.Process>;
    globMock: IMock<IGlob>;
    searchHandlerFactoryMock: IMock<ISearchHandlerFactory>;

    @Setup
    public beforeEach() {
        const out = { mockConsole: <any>null };
        this.msgr = mockMessagerFactory({out: out});
        this.settingsMock = Mock.ofType<ISettingsProvider>();
        this.fsMock = Mock.ofType<IFileSystem>();
        this.pathMock = Mock.ofType<IPath>();
        this.globMock = Mock.ofType<IGlob>();
        this.searchHandlerFactoryMock = Mock.ofType<ISearchHandlerFactory>();
        this.inst = new TemplateManager(this.settingsMock.object, this.msgr,
            this.procMock.object,
            this.globMock.object, this.searchHandlerFactoryMock.object);
    }

    @AsyncTest()
    async list_() {
        throw new Error("Unimplemented test.");
    }
}

import { AsyncTest, FocusTests, Setup, TestFixture, Test } from 'alsatian';
import { Assert } from 'alsatian-fluent-assertions';
import { IMock, It, Mock, Times } from 'typemoq';
import { IFileSystem, IPath, ISettingsProvider, ITemplate, IUserMessager } from "../../../src/lib/i";
import { mockMessagerFactory } from '../../../src/spec-lib';
import { EventEmitter, TemplateSearchEmitterType } from '../emitters';
import { IEventEmitter } from '../emitters/i';
import { IGlobFactory } from '../util/i-glob-factory';
import { ISearchHandlerFactory } from './i-search-handler-factory';
import { TemplateManager } from './template-manager';
import { ISearchHandler } from './i-search-handler';
import { SearchHandler } from './search-handler';
import { SearchHandlerFactory } from './search-handler-factory';
import { ITemplatePreprocessor } from './i-template-preprocessor';
import { IGlob } from 'glob';
import { ITemplatePathUtil } from './i-template-path-util';

@TestFixture("Template Manager Tests")
@FocusTests
export class TemplateManagerTests {
    msgr: IUserMessager;
    inst: TemplateManager;
    settingsMock: IMock<ISettingsProvider>;
    fsMock: IMock<IFileSystem>;
    pathUtilMock: IMock<ITemplatePathUtil>;
    procMock: IMock<NodeJS.Process>;
    globFactoryMock: IMock<IGlobFactory>;
    tmplPrepMock: IMock<ITemplatePreprocessor>;
    searchHandlerFactory: ISearchHandlerFactory;

    @Setup
    public beforeEach() {
        const out = { mockConsole: <any>null };
        this.msgr = mockMessagerFactory({out: out});
        this.settingsMock = Mock.ofType<ISettingsProvider>();
        this.fsMock = Mock.ofType<IFileSystem>();
        this.pathUtilMock = Mock.ofType<ITemplatePathUtil>();
        this.procMock = Mock.ofType<NodeJS.Process>();
        this.globFactoryMock = Mock.ofType<IGlobFactory>();
        this.tmplPrepMock = Mock.ofType<ITemplatePreprocessor>();
        this.searchHandlerFactory = new SearchHandlerFactory(this.msgr,
            this.fsMock.object, this.pathUtilMock.object, this.tmplPrepMock.object);
        this.inst = new TemplateManager(this.settingsMock.object, this.msgr,
            this.procMock.object,
            this.globFactoryMock.object, this.searchHandlerFactory);
    }

    @Test()
    list_tracksAndReturnsAllTemplatesAtEnd() {
        const globbers: EventEmitter<{"end":{}}>[] = [];
        this.globFactoryMock
            .setup(m => m.build(It.isAnyString(), It.isAny()))
            .returns(_ => {
                const gm = new EventEmitter<{"end":{}}>();
                globbers.push(gm);
                return <any>gm; // fake Glob
            });
        const cbMock = Mock.ofInstance((t: ITemplate[]) => {});
        const emitter = this.inst.list(cbMock.object);
        const fullEmitter = <IEventEmitter<TemplateSearchEmitterType>> emitter;
        const mockTemplates = <ITemplate[]> <any> [ "mock", "templates" ];
        fullEmitter.emit("match", mockTemplates[0]);
        fullEmitter.emit("match", mockTemplates[1]);
        globbers.map(g => g.emit("end", "bogus"));

        cbMock.verify(m => m(It.is(a => <any>Assert(a).hasElements(mockTemplates))), Times.once());
    }

    @Test()
    list_setsUpSearchGlobsWithCorrectLocationAndPath() {
        const methodRef = this.inst["setupSearchGlob"];
        const sgMock = Mock.ofType<typeof methodRef>();
        this.inst["setupSearchGlob"] = sgMock.object;
        this.inst.list();

        for (let key in this.inst["searchLocations"]) {
            sgMock.verify(
                m => m(
                    key, this.inst["searchLocations"], It.is(sh => sh instanceof SearchHandler),
                    It.isAnyObject(EventEmitter), It.is(a => a instanceof Array)),
                Times.once())
        }
    }

    @Test()
    _setupSearchGlob_correctlyBindsParams() {
        const path = "/tmp/mypath";
        const ps = {};
        ps[path] = "something";
        const gm = Mock.ofType<IGlob>();
        this.globFactoryMock
            .setup(m => m.build(It.isAnyString(), It.isAny()))
            .returns(_ => gm.object);
        const shm = Mock.ofType<ISearchHandler>();
        const dem = new EventEmitter<TemplateSearchEmitterType>();
        const tmpl = <any>["mytemplates"];
        this.inst["setupSearchGlob"](path, ps, shm.object, dem, tmpl);

        this.globFactoryMock
            .verify(m => m.build(path, { cwd: ps[path] }), Times.once());
        gm.verify(m => m.on("match", It.is(sh => { sh("bogus"); return true; })), Times.once());
        gm.verify(m => m.on("end", It.is(sh => { sh(); return true; })), Times.once());
        shm.verify(m => m.templateMatch(dem, ps[path], "bogus"), Times.once());
        shm.verify(m => m.endList(tmpl, dem, path), Times.once());
    }

    @AsyncTest()
    async list_collatesSources_sendsToMatch() {
        
    }

    @AsyncTest()
    async list_registersOptionalEmitters() {

    }

    @AsyncTest()
    async list_anyErrorInSetup_sendsToError() {

    }

    @AsyncTest()
    async list_searchesGlobalTemplates() {

    }

    @AsyncTest()
    async list_searchesLocalProjectTemplates() {

    }

    @AsyncTest()
    async info_returnsTemplateIfFound() {

    }

    @AsyncTest()
    async info_rejectsWithAppropriateErrorObjectIfTemplateNotFound() {

    }

    @AsyncTest()
    async info_rejectsWithErrorWrapperOnError() {

    }
}
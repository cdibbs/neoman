import { Setup, Test, TestFixture } from 'alsatian';
import { IMock, Mock } from 'typemoq';
import { mockMessagerFactory } from '../spec-lib/typemoq-messager';
import { ICommandFactory } from './commands';
import { IPackage, IPath, ISettingsProvider, Ii18nFunction } from './i';
import { UserMessager } from './integrations';
import { Kernel } from './kernel';


@TestFixture("Kernel tests")
export class KernelTests {
    procMock: IMock<NodeJS.Process>;
    spMock: IMock<ISettingsProvider>;
    pkgMock: IMock<IPackage>;
    cfMock: IMock<ICommandFactory>;
    i18nMock: IMock<Ii18nFunction>;
    k: Kernel;
    pathMock: IMock<IPath>;
    msgr: UserMessager;
    
    @Setup
    public beforeEach() {
        this.pathMock = Mock.ofType<IPath>();
        this.msgr = mockMessagerFactory();
        this.procMock = Mock.ofType<NodeJS.Process>();
        this.pkgMock = Mock.ofType<IPackage>();
        this.spMock = Mock.ofType<ISettingsProvider>();
        this.cfMock = Mock.ofType<ICommandFactory>();
        this.i18nMock = Mock.ofType<Ii18nFunction>();
        this.k = new Kernel(this.msgr, this.procMock.object, this.spMock.object, this.pkgMock.object, this.cfMock.object, this.i18nMock.object);
    }

    @Test("incomplete test")
    public match_emptyGlobList_returnsEmpty() {
    }
}
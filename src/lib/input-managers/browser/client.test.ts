import { Test, Setup, TestCase } from "alsatian";
import * as launchpad from 'launchpad';
import { IMock, Mock, It, Times } from "typemoq";
import { Client } from "./client";
import { mockMessagerFactory } from "../../../spec-lib";
import { UserMessager } from "../../user-messager";
import { Assert } from "alsatian-fluent-assertions";


export class ClientTest {
    protected launchpadMock: IMock<typeof launchpad>;
    protected msgr: UserMessager;
    protected resolveMock: IMock<(v?: {} | PromiseLike<{}>) => void>;
    protected rejectMock: IMock<(r?: any) => void>;
    protected client: Client;

    @Setup
    public beforeEach() {
        this.launchpadMock = Mock.ofType<typeof launchpad>();
        this.msgr = mockMessagerFactory();
        this.resolveMock = Mock.ofInstance(() => {});
        this.rejectMock = Mock.ofInstance(() => {});
        this.client = new Client(this.msgr, this.resolveMock.object, this.rejectMock.object);
        this.client.launchpad = this.launchpadMock.object;

        // Make sure non-public methods under test exist.
        Assert(this.client["launchBrowserLocal"]).is(Function);
        Assert(this.client["handleLaunchResult"]).is(Function);
    }

    @Test()
    public launch_getsLocalLauncherBoundToInstance() {
        const lblMock = Mock.ofInstance(() => {});
        this.client["launchBrowserLocal"] = lblMock.object;
        this.client.launch();
        let cb: Function;
        this.launchpadMock.verify(x => x.local(It.is<(err: any, lb: launchpad.Launcher) => any>(f => { cb = f; return true; })), Times.once());
        cb();
        lblMock.verify(x => x(), Times.once());
    }

    @TestCase(false, 0)
    @TestCase(true, 1)
    @Test()
    public stop_stopsBrowserInstanceIffExists(hasInstance: boolean, stopCalled: number) {
        const biMock = Mock.ofType<launchpad.Instance>();
        this.client.browserInstance = hasInstance ? biMock.object : null;
        this.client.stop();

        let fn: Function;
        biMock.verify(x => x.stop(It.is(f => { fn = f; return f instanceof Function; })), Times.exactly(stopCalled));
        Assert(fn)
            .maybe(hasInstance).is(Function);
        Assert(() => fn())
            .maybe(hasInstance).not.throws(); // check unerroring no op
    }

    @Test()
    public launchBrowserLocal_hasError_rejects() {
        this.client["launchBrowserLocal"]("something", null);
        this.rejectMock.verify(x => x("something"), Times.once());
    }

    @Test()
    public launchBrowserLocal_noError_callsLauncher() {
        const lMock = Mock.ofType<launchpad.Launcher>();
        const hlrMock = Mock.ofInstance((e: any, inst: launchpad.Instance) => {});
        this.client["handleLaunchResult"] = hlrMock.object;
        this.client["launchBrowserLocal"](null, lMock.object);
        this.rejectMock.verify(x => x("something"), Times.never());
        let hlr: Function;
        lMock.verify(x => x(It.isAnyString(), It.isAny(), It.is(f => { hlr = f; return f instanceof Function; })), Times.once());
        Assert(hlr).is(Function);
        hlr();
        hlrMock.verify(x => x(It.isAny(), It.isAny()), Times.once());
    }

    @Test()
    public handleLaunchResult_givenError_rejects() {
        this.client["handleLaunchResult"]("bogus", null);
        this.rejectMock.verify(x => x("bogus"), Times.once());
    }

    @Test()
    public handleLaunchResult_noError_setsInstance() {
        const bogus: any = <any>"bogus instance";
        this.client["handleLaunchResult"](null, bogus);
        Assert(this.client).has(x => x.browserInstance).that.equals(bogus);
    }
}
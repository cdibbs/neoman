import { IUserMessager } from "../../i";
import { curry } from '../../util/curry';
import * as launchpad from 'launchpad';

export class Client {
    launchpad: typeof launchpad = launchpad;
    browserInstance: launchpad.Instance;

    constructor(
        protected msg: IUserMessager,
        protected resolve: (value?: {} | PromiseLike<{}>) => void,
        protected reject: (reason?: any) => void
    ) {

    }

    launch(): void {
        this.launchpad.local(curry.bindOnly(this.launchBrowserLocal, this));
    }

    stop(): void {
        if (this.browserInstance) {
            this.browserInstance.stop(() => {});
        }
    }

    protected launchBrowserLocal(error: any, launcher: launchpad.Launcher): void {
        if (error) {
            this.reject(error);
        } else {
            launcher(
                "http://localhost:3638",
                <launchpad.LaunchOptions>{ browser: "chrome", args: "--new-window" },
                curry.oneOf3(this.handleLaunchResult, this, this.reject)
            );
        }
    }

    protected handleLaunchResult(reject: (error?: any) => void, error: any, inst: launchpad.Instance): void {
        if (error) {
            reject(error);
        } else {
            this.browserInstance = inst;
        }
    }
}
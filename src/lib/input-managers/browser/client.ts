import { IUserMessager } from "../../i";
import { curry } from '../../util/curry';
import * as launchpad from 'launchpad';
import { injectable } from "inversify";

@injectable()
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
                curry.bindOnly(this.handleLaunchResult, this)
            );
        }
    }

    protected handleLaunchResult(error: any, inst: launchpad.Instance): void {
        if (error) {
            this.reject(error);
        } else {
            this.browserInstance = inst;
        }
    }
}
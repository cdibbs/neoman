import { injectable, inject } from 'inversify';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as launch from 'launchpad';
import TYPES from '../di/types';

import * as i from '../i';
import * as it from '../i/template';

@injectable()
export class BrowserInputManager implements i.IInputManager {
    constructor(
        @inject(TYPES.UserMessager) protected msg: i.IUserMessager,
        @inject(TYPES.Path) private path: i.IPath,
    ) {}

    ask(config: it.IInputConfig): Promise<{ [key: string]: any }> {
        let answers = {};
        let promise = null;
        this.msg.write("Launching browser... please answer template questions and close.");

        promise = new Promise((resolve, reject) => {
            let instance: launch.Instance;
            let server: { close: Function };

            var app = express();
            app.use(bodyParser.json());
            console.log(this.path.join(__dirname, '..', 'browser-prompt'));

            app.use('/', express.static(this.path.join(__dirname, '..', 'browser-prompt')));

            app.get('/questions', function(req, res) {
                res.json(config);
            });

            app.post('/', function(req, res) {
                console.log(req.body);
                resolve(req.body);
                //instance.stop(() => {});
                server.close();
            });

            server = app.listen(3000, function() { 
                launch.local(function(error, launcher) {
                    launcher("http://localhost:3000", <launch.LaunchOptions>{ browser: "chrome", args: "--new-window" }, function(error, inst) {
                        instance = inst;
                    });
                });
            });
        });

        return promise || new Promise(resolve => resolve({}));
    }
}
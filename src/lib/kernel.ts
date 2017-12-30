import { injectable, inject } from 'inversify';
import * as commandpost from 'commandpost';
import * as i18n from 'i18n';
let NestedError = require('nested-error-stacks');

import { COMMANDS } from './commands';
import { curry } from './util/curry';
import { ICommandFactory, INewCmdOpts, INewCmdArgs, IInfoCmdArgs, IInfoCmdOpts } from './commands/i';
import TYPES from './di/types';
import KEYS from './settings-keys';
import { ISettingsProvider, IPackage, IUserMessager, Ii18nFunction, IKernel } from './i';

/**
 * Contains the core code to run the application. Only DI runs before this.
 */
@injectable()
export class Kernel implements IKernel {
    private tempDir: string;
    private commandpost = commandpost;

    constructor(
        @inject(TYPES.UserMessager) private msg: IUserMessager,
        @inject(TYPES.Process) private process: NodeJS.Process,
        @inject(TYPES.SettingsProvider) private settings: ISettingsProvider,
        @inject(TYPES.PackageJson) private pkg: IPackage,
        @inject(TYPES.CommandFactory) private commandFactory: ICommandFactory,
        @inject(TYPES.i18n) private __mf: Ii18nFunction
    ) {
        this.tempDir = this.settings.get(KEYS.tempDirKey);
    }

    Go(argv: string[] = process.argv): Promise<{}> {
        try {
            let imsg = this.msg.i18n();
            let root = commandpost
                .create<any, any>("")
                .version(this.pkg.version, "-v, --version")
                .description(imsg.mf("Manage and run Neoman project templates."))
                /*.action((opts, args) => {
                    this.msg.write("Manage and run Neoman project templates.\n", 1);
                    this.msg.write(root.helpText());
                })*/

            let newCmd = this.commandFactory.build(COMMANDS.NewProject, this.tempDir);
            let newTemp = root
                .subCommand<INewCmdOpts, INewCmdArgs>("new <template>")
                .description(imsg.mf("Generate a project from a Neoman template."))
                .option("-n, --name <name>", imsg.mf("The project name to use. Default: current directory name."))
                .option("-d, --defaults", imsg.mf("No prompting. Use template defaults for options not specified on command line."))
                .option("-p, --path <path>", imsg.mf("Destination path in which to create project. Defaults to current directory."))
                .option("-f, --force", imsg.mf("Force things you probably shouldn't force. Don't do it, blah blah..."))
                .option("-v, --verbosity <verbosity>", imsg.mf("The verbosity of neoman's output. Can be normal, verbose, debug."))
                .option("-x, --show-excluded", imsg.mf("Show files excluded by template configuration."))
                .action(newCmd.run.bind(newCmd));

            let listCmd = this.commandFactory.build(COMMANDS.ListTemplates, this.tempDir);
            let list = root
                .subCommand<{}, {}>("list")
                .description(imsg.i18n({ dir: this.tempDir }).mf('List available templates. Template source directory: {dir}'))
                .action(listCmd.run.bind(listCmd));

            let setdirCmd = this.commandFactory.build(COMMANDS.SetDir, this.tempDir);
            let config = root
                .subCommand<{}, { directory: string }>("setdir <directory>")
                .description(imsg.mf("Set your template source base directory. All first-level subdirectories will be scanned for templates."))
                .action(setdirCmd.run.bind(setdirCmd));

            let infoCmd = this.commandFactory.build(COMMANDS.Info, this.tempDir);
            let info = root
                .subCommand<IInfoCmdOpts, IInfoCmdArgs>("info <tmplId>")
                .description(imsg.mf("Get detailed information for a given template identifier."))
                .action(infoCmd.run.bind(infoCmd));

            return this.commandpost
                .exec(root, argv)
                .catch(curry.bindOnly(this.handleError, this));
        } catch (ex) {
            return this.handleError(ex);
        }
    }

    handleError(err: Error): Promise<{}> {
        let nerr = new NestedError(this.msg.mf("There was an unexpected error."), err);
        this.msg.error(nerr);
        this.msg.error(err.stack);
        this.process.exit(1); // can be no-op in integ tests
        return Promise.reject(nerr);
    }
}
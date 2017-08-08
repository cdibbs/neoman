import { injectable, inject } from 'inversify';
import * as commandpost from 'commandpost';
import * as i18n from 'i18n';
let NestedError = require('nested-error-stacks');

import { COMMANDS } from './commands';
import { curry } from './util/curry';
import { ICommandFactory, INewCmdOpts, INewCmdArgs, IInfoCmdArgs, IInfoCmdOpts } from './commands/i';
import TYPES from './di/types';
import KEYS from './settings-keys';
import { ISettingsProvider, IPackage, IUserMessager, Ii18nFunction } from './i';

/**
 * Contains the core code to run the application. Only DI runs before this.
 */
@injectable()
export class Kernel {
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

    Go(): void {
        try {
            let root = commandpost
                .create<any, any>("")
                .version(this.pkg.version, "-v, --version")
                .description(this.__mf("Manage and run Neoman project templates."))
                /*.action((opts, args) => {
                    this.msg.write("Manage and run Neoman project templates.\n", 1);
                    this.msg.write(root.helpText());
                })*/

            let newCmd = this.commandFactory.build(COMMANDS.NewProject, this.tempDir);
            let newTemp = root
                .subCommand<INewCmdOpts, INewCmdArgs>("new <template>")
                .description(this.__mf("Generate a project from a Neoman template."))
                .option("-n, --name <name>", this.__mf("The project name to use. Default: current directory name."))
                .option("-d, --defaults", this.__mf("No prompting. Use template defaults for options not specified on command line."))
                .option("-p, --path <path>", this.__mf("Destination path in which to create project. Defaults to current directory."))
                .option("-f, --force", this.__mf("Force things you probably shouldn't force. Don't do it, blah blah..."))
                .option("-v, --verbosity <verbosity>", this.__mf("The verbosity of neoman's output. Can be normal, verbose, debug."))
                .option("-x, --show-excluded", this.__mf("Show files excluded by template configuration."))
                .action(newCmd.run.bind(newCmd));

            let listCmd = this.commandFactory.build(COMMANDS.ListTemplates, this.tempDir);
            let list = root
                .subCommand<{}, {}>("list")
                .description(this.__mf('List available templates. Template source directory: {dir}', { dir: this.tempDir }))
                .action(listCmd.run.bind(listCmd));

            let setdirCmd = this.commandFactory.build(COMMANDS.SetDir, this.tempDir);
            let config = root
                .subCommand<{}, { directory: string }>("setdir <directory>")
                .description(this.__mf("Set your template source base directory. All first-level subdirectories will be scanned for templates."))
                .action(setdirCmd.run.bind(setdirCmd));

            let infoCmd = this.commandFactory.build(COMMANDS.Info, this.tempDir);
            let info = root
                .subCommand<IInfoCmdOpts, IInfoCmdArgs>("info <tmplId>")
                .description(this.__mf("Get detailed information for a given template identifier."))
                .action(infoCmd.run.bind(infoCmd));

            this.commandpost
                .exec(root, this.process.argv)
                .catch(curry.bindOnly(this.handleError, this));
        } catch (ex) {
            this.handleError(ex);
        }
    }

    handleError(err: Error): void {
        this.msg.error(new NestedError("There was an unexpected error.", err));
        this.process.exit(1);
    }
}
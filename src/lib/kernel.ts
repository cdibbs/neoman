import { injectable, inject } from 'inversify';
import * as commandpost from 'commandpost';

import { COMMANDS } from './commands';
import { ICommandFactory, INewCmdOpts, INewCmdArgs, IInfoCmdArgs, IInfoCmdOpts } from './commands/i';
import TYPES from './di/types';
import KEYS from './settings-keys';
import { IGlobber, ISettingsProvider, IPackage, IUserMessager } from './i';

/**
 * Contains the core code to run the application. Only DI runs before this.
 */
@injectable()
export class Kernel {
    private tempDir: string;

    constructor(
        @inject(TYPES.Globber) private globber: IGlobber,
        @inject(TYPES.UserMessager) private msg: IUserMessager,
        @inject(TYPES.Process) private process: NodeJS.Process,
        @inject(TYPES.SettingsProvider) private settings: ISettingsProvider,
        @inject(TYPES.PackageJson) private pkg: IPackage,
        @inject(TYPES.CommandFactory) private commandFactory: ICommandFactory
    ) {
        this.tempDir = this.settings.get(KEYS.tempDirKey);
    }

    Go(): void {
        try {
            let root = commandpost
                .create<any, any>("")
                .version(this.pkg.version, "-v, --version");

            let newCmd = this.commandFactory.build(COMMANDS.NewProject, this.tempDir);
            let newTemp = root
                .subCommand<INewCmdOpts, INewCmdArgs>("new <template>")
                .description("Generate a project from a Neoman template.")
                .option("-n, --name <name>", "The project name to use. Default: current directory name.")
                .option("-d, --defaults", "No prompting. Use template defaults for options not specified on command line.")
                .option("-p, --path <path>", "Destination path in which to create project. Defaults to current directory.")
                .option("-f, --force", "Force things you probably shouldn't force. Don't do it, blah blah...")
                .option("-v, --verbosity <verbosity>", "The verbosity of neoman's output. Can be normal, verbose, debug.")
                .option("-x, --show-excluded", "Show files excluded by template configuration.")
                .action(newCmd.run.bind(newCmd));

            let listCmd = this.commandFactory.build(COMMANDS.ListTemplates, this.tempDir);
            let list = root
                .subCommand<{}, {}>("list")
                .description(`List available templates. Template source dir: ${this.tempDir}`)
                .action(listCmd.run.bind(listCmd));

            let setdirCmd = this.commandFactory.build(COMMANDS.SetDir, this.tempDir);
            let config = root
                .subCommand<{}, { directory: string }>("setdir <directory>")
                .description("Set your template source base directory. All first-level subdirectories will be scanned for templates.")
                .action(setdirCmd.run.bind(setdirCmd));

            let infoCmd = this.commandFactory.build(COMMANDS.Info, this.tempDir);
            let info = root
                .subCommand<IInfoCmdOpts, IInfoCmdArgs>("info <tmplId>")
                .description("Get detailed information for a given template identifier.")
                .action(infoCmd.run.bind(infoCmd));

            commandpost
                .exec(root, this.process.argv)
                .catch(err => {
                    if (err instanceof Error) {
                        this.msg.error(err.stack);
                    } else {
                        this.msg.error(err.message);
                    }
                    this.process.exit(1);
                });
        } catch (ex) {
            this.msg.error("There was an error.");
            this.msg.error(ex);
        }
    }
}
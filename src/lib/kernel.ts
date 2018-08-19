import { injectable, inject } from 'inversify';
import { create, exec, CommandpostError } from 'commandpost';
import * as i18n from 'i18n';
let NestedError = require('nested-error-stacks');

import { COMMANDS } from './commands';
import { curry } from './util/curry';
import { ICommandFactory, INewCmdOpts, INewCmdArgs, IInfoCmdArgs, IInfoCmdOpts } from './commands/i';
import TYPES from './di/types';
import KEYS from './settings-keys';
import { ISettingsProvider, IPackage, IUserMessager, Ii18nFunction, IKernel } from './i';
import { cmdErrors } from './cmd-errors';
import { CommandResult, CommandValidationResult, CommandErrorType } from './models';

/**
 * Contains the core code to run the application. Only DI runs before this.
 */
@injectable()
export class Kernel implements IKernel {
    private tempDir: string;
    private cpCreate = create;
    private exec = exec;

    public constructor(
        @inject(TYPES.UserMessager) private msg: IUserMessager,
        @inject(TYPES.Process) private process: NodeJS.Process,
        @inject(TYPES.SettingsProvider) private settings: ISettingsProvider,
        @inject(TYPES.PackageJson) private pkg: IPackage,
        @inject(TYPES.CommandFactory) private commandFactory: ICommandFactory,
        @inject(TYPES.i18n) private __mf: Ii18nFunction
    ) {
        this.tempDir = this.settings.get(KEYS.tempDirKey);
    }

    public async Go(argv: string[] = this.process.argv): Promise<{}> {
        try {
            let imsg = this.msg.i18n();
            let root = this.cpCreate<any, any>("")
                .version(this.pkg.version, "-v, --version")
                .description(imsg.mf("Manage and run Neoman project templates. Use: `neoman help [command]` for more help."));

            const newTmpl = root
                .subCommand<INewCmdOpts, INewCmdArgs>("new [templateId]")
                .description(imsg.mf("Generate a project from a Neoman template."))
                .option("-n, --name <name>", imsg.mf("The project name to use. Default: current directory name."))
                .option("-d, --defaults", imsg.mf("No prompting. Use template defaults for options not specified on command line."))
                .option("-p, --path <path>", imsg.mf("Destination path in which to create project. Defaults to current directory."))
                .option("-f, --force", imsg.mf("Force things you maybe shouldn't force."))
                .option("-v, --verbosity <verbosity>", imsg.mf("The verbosity of neoman's output. Can be normal, verbose, debug."))
                .option("-x, --show-excluded", imsg.mf("Show files excluded by template configuration."));
            this.commandFactory.build(COMMANDS.NewProject, this.tempDir, newTmpl);

            const list = root
                .subCommand<{}, {}>("list")
                .description(imsg.mf('List available templates. Template source directory: {dir}', { dir: this.tempDir }));
            this.commandFactory.build(COMMANDS.ListTemplates, this.tempDir, list);

            
            const setdir = root
                .subCommand<{}, { directory: string }>("setdir <directory>")
                .description(imsg.mf("Set your template source base directory. All first-level subdirectories will be scanned for templates."));
            this.commandFactory.build(COMMANDS.SetDir, this.tempDir, setdir);

            const info = root
                .subCommand<IInfoCmdOpts, IInfoCmdArgs>("info [templateId]")
                .description(imsg.mf("Get detailed information for a given template identifier."));
            this.commandFactory.build(COMMANDS.Info, this.tempDir, info);

            let result = <CommandResult>await this.exec(root, argv);
            this.handleCommandResult(result);
        } catch (ex) {
            return this.handleError(ex);
        }
    }

    // FIXME TODO handle errors better (different CommandErrorTypes, etc)
    protected async handleCommandResult(result: CommandResult): Promise<{}> {
        if (result instanceof CommandValidationResult && result.ErrorType === CommandErrorType.UserError) {
            this.msg.info("The following validation errors occured:\n\n");
            for (let msg of result.Messages) {
                this.msg.info(" - " + msg);
            }
            this.process.exit(2);
        } else if (result instanceof Error) {
            let nerr = new NestedError(this.msg.mf("There was an unexpected error."), result);
            this.msg.error(nerr.stack);
            this.process.exit(1); // can be no-op in integ tests
            return Promise.reject(nerr);
        }

        this.process.exit();
    }

    protected async handleError(err: Error): Promise<{}> {
        if (err instanceof CommandpostError) {
            this.msg.error(cmdErrors[err.params.reason](err));
            this.process.exit(2);
        } else {
            this.msg.error(err)
            this.process.exit(1);
        }

        return Promise.reject(err);
    }
}
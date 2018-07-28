import * as fs from 'fs';
import * as glob from 'glob';
import * as i18n from 'i18n';
import { Container } from "inversify";
import * as osLocale from 'os-locale';
import * as path from 'path';
import 'reflect-metadata';
import { IMapperService, MapperService } from 'simple-mapper';
import { CommandFactory, ICommandValidator, INewCmdArgs, INewCmdOpts, InfoCommand, ListCommand, NewCommand, NewCommandValidator, SetDirCommand } from '../commands';
import { ICommand, ICommandFactory, IInfoCmdArgs, IInfoCmdOpts } from "../commands/i";
import { ITemplateInfo } from "../commands/info/i/i-template-info";
import { InfoCommandValidator } from "../commands/info/info-command-validator";
import { TemplateInfo } from "../commands/info/template-info";
import { ListCommandValidator } from "../commands/list/list-command-validator";
import { ErrorReporter } from '../error-reporter';
import { FilePatterns } from '../file-patterns';
import { HandlerService } from '../handler-service';
import * as i from '../i';
import { BrowserInputManager, ClientFactory, CustomInputManager, DefaultsInputManager, Duplexer, IClientFactory, IDuplexer, IServerFactory, IWebSocketFactory, InputManager, PromptInputManager, ServerFactory, WebSocketFactory } from '../input-managers';
import * as m from '../models';
import { ITemplateManager, TemplateManager } from "../template-management";
import { FSTreeProcessor, RealTreeDiscoveryHandler, SimulatedTreeDiscoveryHandler } from "../template-runner";
import { IFSTreeProcessor, ITreeDiscoveryEventHandler } from "../template-runner/i";
import { TemplateRunner } from '../template-runner/template-runner';
import { TemplateValidator } from '../template-validator';
import { PathTransformManager, ContentTransformManager } from '../transformers';
import * as it from '../transformers/i';
import { UserMessager } from '../user-messager';
import { GlobFactory } from "../util/glob-factory";
import { IGlobFactory } from "../util/i-glob-factory";
import { Kernel, SettingsProvider } from "./entities";
import TYPES from "./types";
import { IDefaultsAnswerer } from '../input-managers/defaults/i-defaults-answerer';
import { DefaultsAnswerer } from '../input-managers/defaults/defaults-answerer';
import { IPluginManager } from '../plugin-manager/i-plugin-manager';
import { PluginManager } from '../plugin-manager/plugin-manager';


export let containerBuilder = (packageJson: any = null, localesPath?: string): Container => {
    let json = packageJson || require(path.join(path.dirname(__filename), "../../package.json"));

    var container = new Container();
    container.bind<i.IKernel>(TYPES.Kernel).to(Kernel);
    container.bind<i.ITemplateRunner>(TYPES.TemplateRunner).to(TemplateRunner);
    container.bind<NodeJS.Process>(TYPES.Process).toDynamicValue(() => process);
    container.bind<i.IPackage>(TYPES.PackageJson).toConstantValue(json);
    container.bind<i.ISettingsProvider>(TYPES.SettingsProvider).to(SettingsProvider);
    container.bind<i.IHandlerService>(TYPES.HandlerService).to(HandlerService);
    container.bind<i.IUserMessager>(TYPES.UserMessager).to(UserMessager);
    container.bind<ITemplateManager>(TYPES.TemplateManager).to(TemplateManager);
    container.bind<it.ITransformManager>(TYPES.TransformManager).to(ContentTransformManager);
    container.bind<it.IPathTransformManager>(TYPES.PathTransformManager).to(PathTransformManager);
    container.bind<i.ITemplateValidator>(TYPES.TemplateValidator).to(TemplateValidator);
    container.bind<i.IFilePatterns>(TYPES.FilePatterns).to(FilePatterns);
    container.bind<i.IInputManager>(TYPES.InputManager).to(InputManager);
    container.bind<i.IInputManager>(TYPES.BrowserInputManager).to(BrowserInputManager);
    container.bind<i.IInputManager>(TYPES.CustomInputManager).to(CustomInputManager);
    container.bind<i.IInputManager>(TYPES.PromptInputManager).to(PromptInputManager);
    container.bind<i.IInputManager>(TYPES.DefaultsInputManager).to(DefaultsInputManager);
    container.bind<IDefaultsAnswerer>(TYPES.DefaultsAnswerer).to(DefaultsAnswerer);
    container.bind<IMapperService>(TYPES.Mapper).toDynamicValue(() => new MapperService());
    container.bind<i.IErrorReporter>(TYPES.ErrorReporter).to(ErrorReporter);
    container.bind<ITemplateInfo>(TYPES.TemplateInfo).to(TemplateInfo);
    container.bind(TYPES.SettingsType).toDynamicValue(() => m.Settings);
    container.bind<IFSTreeProcessor>(TYPES.FSTreeProcessor).to(FSTreeProcessor);
    container.bind<ITreeDiscoveryEventHandler>(TYPES.RealTreeDiscoveryHandler).to(RealTreeDiscoveryHandler);
    container.bind<ITreeDiscoveryEventHandler>(TYPES.SimulatedTreeDiscoveryHandler).to(SimulatedTreeDiscoveryHandler);
    container.bind<IDuplexer>(TYPES.BrowserClientDuplexer).to(Duplexer);
    container.bind<IServerFactory>(TYPES.BIMServerFactory).to(ServerFactory);
    container.bind<IClientFactory>(TYPES.BIMClientFactory).to(ClientFactory);
    container.bind<IWebSocketFactory>(TYPES.BIMWebSocketFactory).to(WebSocketFactory);
    container.bind<IPluginManager>(TYPES.PluginManager).to(PluginManager);

    let lobj = <typeof i18n>{};
    i18n.configure({
        defaultLocale: 'en_US',
        directory: localesPath || path.join(__dirname, '..', "/locales"),
        register: lobj
    });
    let lang = osLocale.sync();
    i18n.setLocale(lang);
    container.bind<i.Ii18nFunction>(TYPES.i18n).toConstantValue(lobj.__mf);

    container.bind<ICommand<any, any>>(TYPES.Commands).to(SetDirCommand);
    container.bind<ICommand<any, any>>(TYPES.Commands).to(NewCommand);
    container.bind<ICommand<any, any>>(TYPES.Commands).to(ListCommand);
    container.bind<ICommand<any, any>>(TYPES.Commands).to(InfoCommand);
    container.bind<ICommandFactory>(TYPES.CommandFactory).to(CommandFactory);

    container.bind<ICommandValidator<INewCmdOpts, INewCmdArgs>>(TYPES.NewCommandValidator).to(NewCommandValidator);
    container.bind<ICommandValidator<IInfoCmdOpts, IInfoCmdArgs>>(TYPES.InfoCommandValidator).to(InfoCommandValidator);
    container.bind<ICommandValidator<any, any>>(TYPES.ListCommandValidator).to(ListCommandValidator);

    container.bind<i.IPath>(TYPES.Path).toConstantValue(path);
    container.bind<i.IFileSystem>(TYPES.FS).toConstantValue(fs);
    container.bind<i.IGlob>(TYPES.Glob).toConstantValue(glob);
    container.bind<IGlobFactory>(TYPES.GlobFactory).to(GlobFactory);
    return container;
};
import { Container } from "inversify";
import 'reflect-metadata';
import * as glob from 'glob';
import * as path from 'path';
import * as fs from 'fs';
import * as i18n from 'i18n';
import * as osLocale from 'os-locale';

import TYPES from "./types";
import { TransformManager, PathTransformManager } from '../transformers';
import { TemplateRunner } from '../template-runner';
import { FilePatterns } from '../file-patterns';
import { UserMessager } from '../user-messager';
import { ErrorReporter } from '../error-reporter';
import { TemplateValidator } from '../template-validator';
import { HandlerService } from '../handler-service';
import { InputManager, BrowserInputManager, CustomInputManager, PromptInputManager, DefaultsInputManager } from '../input-managers';
import { Kernel, SettingsProvider, TemplateManager } from "./entities";
import { CommandFactory, SetDirCommand, NewCommand, ListCommand, InfoCommand } from '../commands';
import { ICommand, ICommandFactory } from "../commands/i";
import { MapperService, IMapperService } from 'simple-mapper';
import * as i from '../i';
import * as it from '../transformers/i';
import * as m from '../models';
import { ITemplateInfo } from "../commands/info/i/i-template-info";
import { TemplateInfo } from "../commands/info/template-info";
import { IGlobFactory } from "../util/i-glob-factory";
import { GlobFactory } from "../util/glob-factory";
import { NewCommandValidator, ICommandValidator, INewCmdArgs, INewCmdOpts } from "../commands";

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
    container.bind<i.ITemplateManager>(TYPES.TemplateManager).to(TemplateManager);
    container.bind<it.ITransformManager>(TYPES.TransformManager).to(TransformManager);
    container.bind<it.IPathTransformManager>(TYPES.PathTransformManager).to(PathTransformManager);
    container.bind<i.ITemplateValidator>(TYPES.TemplateValidator).to(TemplateValidator);
    container.bind<i.IFilePatterns>(TYPES.FilePatterns).to(FilePatterns);
    container.bind<i.IInputManager>(TYPES.InputManager).to(InputManager);
    container.bind<i.IInputManager>(TYPES.BrowserInputManager).to(BrowserInputManager);
    container.bind<i.IInputManager>(TYPES.CustomInputManager).to(CustomInputManager);
    container.bind<i.IInputManager>(TYPES.PromptInputManager).to(PromptInputManager);
    container.bind<i.IInputManager>(TYPES.DefaultsInputManager).to(DefaultsInputManager);
    container.bind<IMapperService>(TYPES.Mapper).to(MapperService);
    container.bind<i.IErrorReporter>(TYPES.ErrorReporter).to(ErrorReporter);
    container.bind<ITemplateInfo>(TYPES.TemplateInfo).to(TemplateInfo);
    container.bind(TYPES.SettingsType).toDynamicValue(() => m.Settings);

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
    container.bind<ICommandFactory>(TYPES.CommandFactory).to(CommandFactory)

    container.bind<ICommandValidator<INewCmdOpts, INewCmdArgs>>(TYPES.NewCommandValidator).to(NewCommandValidator);

    container.bind<i.IPath>(TYPES.Path).toConstantValue(path);
    container.bind<i.IFileSystem>(TYPES.FS).toConstantValue(fs);
    container.bind<i.IGlob>(TYPES.Glob).toConstantValue(glob);
    container.bind<IGlobFactory>(TYPES.GlobFactory).to(GlobFactory);
    return container;
};
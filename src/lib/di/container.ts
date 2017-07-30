import { Container } from "inversify";
import 'reflect-metadata';
import * as glob from 'glob';
import * as path from 'path';
import * as fs from 'fs';
import * as i18n from 'i18n';

import TYPES from "./types";
import { TransformManager, PathTransformManager } from '../transformers';
import { TemplateRunner } from '../template-runner';
import { FilePatterns } from '../file-patterns';
import { UserMessager } from '../user-messager';
import { TemplateValidator } from '../template-validator';
import { HandlerService } from '../handler-service';
import { InputManager, BrowserInputManager, CustomInputManager, PromptInputManager } from '../input-managers';
import { Kernel, SettingsProvider, TemplateManager } from "./entities";
import { CommandFactory, SetDirCommand, NewCommand, ListCommand, InfoCommand } from '../commands';
import { ICommand, ICommandFactory } from "../commands/i";
import * as i from '../i';
import * as it from '../transformers/i';

let json = require(path.join(path.dirname(__filename), "../../package.json"));

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

i18n.configure({
    directory: path.join(__dirname, '..', "/locales")
});    
container.bind<i.Ii18nFunction>(TYPES.i18n).toConstantValue(i18n.__mf);

container.bind<ICommand<any, any>>(TYPES.Commands).to(SetDirCommand);
container.bind<ICommand<any, any>>(TYPES.Commands).to(NewCommand);
container.bind<ICommand<any, any>>(TYPES.Commands).to(ListCommand);
container.bind<ICommand<any, any>>(TYPES.Commands).to(InfoCommand);
container.bind<ICommandFactory>(TYPES.CommandFactory).to(CommandFactory)

container.bind<i.IPath>(TYPES.Path).toConstantValue(path);
container.bind<i.IFileSystem>(TYPES.FS).toConstantValue(fs);
container.bind<i.IGlob>(TYPES.Glob).toConstantValue(glob);

export default container;
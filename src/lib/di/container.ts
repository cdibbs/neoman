import { Container } from "inversify";
import 'reflect-metadata';
import * as glob from 'glob';
import * as path from 'path';
import * as fs from 'fs';

import TYPES from "./types";
import { TransformManager } from '../transformers/transform-manager';
import { TemplateRunner } from '../template-runner';
import { FilePatterns } from '../file-patterns';
import { Globber, Kernel, SettingsProvider, TemplateManager } from "./entities";
import { CommandFactory, SetDirCommand, NewCommand, ListCommand, InfoCommand } from '../commands';
import { ICommand, ICommandFactory } from "../commands/i";
import * as i from '../i';
import * as it from '../transformers/i';

let json = require("../../package.json");

var container = new Container();
container.bind<i.IGlobber>(TYPES.Globber).to(Globber);
container.bind<i.IKernel>(TYPES.Kernel).to(Kernel);
container.bind<i.ITemplateRunner>(TYPES.TemplateRunner).to(TemplateRunner);
container.bind<NodeJS.Process>(TYPES.Process).toDynamicValue(() => process);
container.bind<i.IPackage>(TYPES.PackageJson).toConstantValue(json);
container.bind<i.ISettingsProvider>(TYPES.SettingsProvider).to(SettingsProvider);
container.bind<i.IUserMessager>(TYPES.UserMessager).toDynamicValue(() => console);
container.bind<i.ITemplateManager>(TYPES.TemplateManager).to(TemplateManager);
container.bind<it.ITransformManager>(TYPES.TransformManager).to(TransformManager);
container.bind<i.IFilePatterns>(TYPES.FilePatterns).to(FilePatterns);

container.bind<ICommand<any, any>>(TYPES.Commands).to(SetDirCommand);
container.bind<ICommand<any, any>>(TYPES.Commands).to(NewCommand);
container.bind<ICommand<any, any>>(TYPES.Commands).to(ListCommand);
container.bind<ICommand<any, any>>(TYPES.Commands).to(InfoCommand);
container.bind<ICommandFactory>(TYPES.CommandFactory).to(CommandFactory)

container.bind<i.IPath>(TYPES.Path).toConstantValue(path);
container.bind<i.IFileSystem>(TYPES.FS).toConstantValue(fs);
container.bind<i.IGlob>(TYPES.Glob).toConstantValue(glob);

export default container;
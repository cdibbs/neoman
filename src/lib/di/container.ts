import { Container } from "inversify";
import 'reflect-metadata';
import * as glob from 'glob';
import * as path from 'path';
import * as fs from 'fs';

import TYPES from "./types";
import { Globber, Kernel, SettingsProvider } from "./entities";
import { CommandFactory, SetDirCommand, NewCommand, ListCommand } from '../commands';
import { ICommand, ICommandFactory } from "../commands/i";
import { IGlobber, IKernel, IPackage, ISettingsProvider, IPath, IFileSystem, IGlob } from '../i';

let json = require("../../package.json");

var container = new Container();
container.bind<IGlobber>(TYPES.Globber).to(Globber);
container.bind<IKernel>(TYPES.Kernel).to(Kernel);
container.bind<NodeJS.Process>(TYPES.Process).toDynamicValue(() => process);
container.bind<IPackage>(TYPES.PackageJson).toConstantValue(json);
container.bind<ISettingsProvider>(TYPES.SettingsProvider).to(SettingsProvider);

container.bind<ICommand<any, any>>(TYPES.Commands).to(SetDirCommand);
container.bind<ICommand<any, any>>(TYPES.Commands).to(NewCommand);
container.bind<ICommand<any, any>>(TYPES.Commands).to(ListCommand);
container.bind<ICommandFactory>(TYPES.CommandFactory).to(CommandFactory)
container.bind<IPath>(TYPES.Path).toConstantValue(path);
container.bind<IFileSystem>(TYPES.FS).toConstantValue(fs);
container.bind<IGlob>(TYPES.Glob).toConstantValue(glob);

export default container;
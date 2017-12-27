/// <reference path="../../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../../node_modules/@types/chai/index.d.ts" />
//import * as fs from 'fs';
import path = require('path');
import fs = require('fs');
import 'reflect-metadata';
import 'mocha';
import * as sinon from 'sinon';
import * as chai from 'chai';
let expect = chai.expect, assert = chai.assert;

import { containerBuilder } from '../lib/di/container';
import TYPES from '../lib/di/types';
import { UserMessager } from '../lib/user-messager';
import { IKernel, ISettingsProvider, IFileSystem, IUserMessager } from '../lib/i';
import { mockMessagerFactory } from '../spec-lib';

describe('Simple', () => {
    let app: IKernel;
    let mockedPath = '/tmp/neoman-e2e'
    let msgr: IUserMessager;
    beforeEach(() => {
        var cont = containerBuilder({ version: "1.2.3" }, "locales/");
        console.log(process.env.HOME)
        if (! process.env.USERPROFILE) {
            cont.rebind<NodeJS.Process>(TYPES.Process).toDynamicValue(() => <NodeJS.Process><any>{ env: { HOME: "/tmp" }, exit: process.exit });
        } else {
            cont.rebind<NodeJS.Process>(TYPES.Process).toDynamicValue(() => <NodeJS.Process><any>{ env: { USERPROFILE: "C:\\temp\\" }, exit: process.exit });
        }
        // WIP capture stdout directly
        //msgr = mockMessagerFactory();
        //cont.rebind<IUserMessager>(TYPES.UserMessager).toDynamicValue(() => msgr);
        app = cont.get<IKernel>(TYPES.Kernel);
    });

    afterEach(() => {
        
    });

    it('runs', (cb) => {
        app.Go(["node", "neoman", "list"]);
        cb();
    });
});
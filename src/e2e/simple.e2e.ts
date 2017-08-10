/// <reference path="../../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../../node_modules/@types/chai/index.d.ts" />
//import * as fs from 'fs';
import * as path from 'path';
import 'reflect-metadata';
import 'mocha';
import * as sinon from 'sinon';
import * as chai from 'chai';
let expect = chai.expect, assert = chai.assert;

import { containerBuilder } from '../lib/di/container';
import TYPES from '../lib/di/types';
import { IKernel, ISettingsProvider, IFileSystem } from '../lib/i';

// Began playing with mock-fs
// https://github.com/unexpectedjs/unexpected-fs/blob/master/index.js#L22-L35
describe('Simple', () => {
    let app: IKernel;
    let mockedPath = '/tmp/neoman-e2e'
    beforeEach(() => {
        let spget = sinon.stub();
        spget.returns('/tmp/mytemplates');
        let cb = containerBuilder({ version: "1.0" }, path.join(__dirname, '../..', "/locales"));
        let fsspec = {
            "something": "whoa",
            "tmp": {
                "mytemplates": {
                    "t-one": {
                        ".neoman.config": {
                            "template.json": '{ "name": "what", "identity": "one" }'
                        }
                    }
                }
            }
        };
        //mockfs(fsspec);
        //let fs = require('fs');
        //cb.rebind<IFileSystem>(TYPES.FS).toConstantValue(fe.fs);
        cb.rebind<ISettingsProvider>(TYPES.SettingsProvider).toConstantValue( { get: spget, set: spget });
        app = cb.get<IKernel>(TYPES.Kernel);

    });

    afterEach(() => {
        //mockfs.restore();
    });

    it('runs', () => {
        app.Go(["node", "neoman", "help"]);
    });
});

function loadFS(path: string): any {

}
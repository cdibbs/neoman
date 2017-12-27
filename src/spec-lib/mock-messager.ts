import * as sinon from 'sinon';

import * as path from 'path';
import { UserMessager } from '../lib/user-messager';
import * as i from '../lib/i';
import * as i18n from 'i18n';

export let mockMessagerFactory = () => {
    /*let m: i.IUserMessager = <any>{
        mf: (a: string, b: any) => a,
        info: (message: any, indent?: number): i.IUserMessager => m,
        debug: (message: any, indent?: number): i.IUserMessager => m,
        warn: (message: any, indent?: number): i.IUserMessager => m,
        error: (message: any, indent?: number): i.IUserMessager => m,
        write: (message: string, indent: number = 0, level: i.Levels = i.LEVELS.Debug): i.IUserMessager => m,
        i18n: (mfDict?: any) => <i.IUserMessager> m
    };*/

    // Set it up so we collect/return english strings.
    i18n.configure({
        locales: ['en_US'],
        defaultLocale: 'en_US',
        syncFiles: true,
        directory: path.join(__dirname, '..', '..', "locales")
    });

    let m = new UserMessager(i18n.__mf);
    m["console"] = <any>{
        log: sinon.stub(),
        error: sinon.stub(),
        warn: sinon.stub()
    };
    return m;
}
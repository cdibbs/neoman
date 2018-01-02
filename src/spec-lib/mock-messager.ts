import * as sinon from 'sinon';

import * as path from 'path';
import { UserMessager } from '../lib/user-messager';
import * as i from '../lib/i';
import * as i18n from 'i18n';

export let mockMessagerFactory = ( { echo = false }: { echo: boolean } = { echo: false }) => {
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

    let log = (...args: any[]) => {
        if (echo) {
            console.log.apply(console, args);
        }
    }
    let err = (...args: any[]) => {
        if (echo) {
            console.error.apply(console, args);
        }
    }
    let warn = (...args: any[]) => {
        if (echo) {
            console.warn.apply(console, args);
        }
    }

    let m = new UserMessager(i18n.__mf);
    m["console"] = <any>{
        log: sinon.spy(log),
        error: sinon.spy(err),
        warn: sinon.spy(warn)
    };
    return m;
}
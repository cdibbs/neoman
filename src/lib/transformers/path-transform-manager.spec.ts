/// <reference path="../../../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../../../node_modules/@types/chai/index.d.ts" />
import "reflect-metadata";
import { expect } from 'chai';
import 'mocha';

import { mockMessagerFactory } from '../../spec-lib'
import { PathTransformManager } from './path-transform-manager';
import * as i from '../i';

describe('PathTransformManager', () => {
    var tm: PathTransformManager;

    beforeEach(() => {
        let filePatterns: i.IFilePatterns = {
            match(path: string, patterns: string[]): string[] {
                return [];
            }
        };
        tm = new PathTransformManager(filePatterns, mockMessagerFactory());
    })

});
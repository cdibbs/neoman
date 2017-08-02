/// <reference path="../../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../../node_modules/@types/chai/index.d.ts" />
import { Stats } from 'fs';
import "reflect-metadata";
import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as sinon from 'sinon';
let expect = chai.expect, assert = chai.assert;

import { TemplateValidator } from './template-validator';
import { PLUGIN_PREFIX } from './constants';
import * as i from './i';
import * as itmp from './i/template';

describe(TemplateValidator.name, () => {
    var tv: TemplateValidator;
    before(() => {
        chai.should();
        chai.use(chaiAsPromised);
    });

    beforeEach(() => {
        tv = new TemplateValidator();
    });

    describe('#dependenciesInstalled', () => {
        let resStub: sinon.SinonStub;
        beforeEach(() => {
            resStub = sinon.stub();
            tv["requireg"] = { resolve: resStub };
        });
        it('should build dictionary of installed plugins', () => {
            let config = {
                configurations: {
                    "one": { plugin: "something" },
                    "two": { plugin: "missing" }
                }
            }
            resStub.withArgs(PLUGIN_PREFIX + "something").returns("");
            resStub.withArgs(PLUGIN_PREFIX + "missing").throws(new Error("missing plugin!"));

            let result = tv.dependenciesInstalled(<any>config);

            expect(result[PLUGIN_PREFIX + "something"]).to.be.true;
            expect(result[PLUGIN_PREFIX + "missing"]).to.be.false;
        });
    });
});
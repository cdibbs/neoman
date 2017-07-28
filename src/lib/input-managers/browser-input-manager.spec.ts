/// <reference path="../../../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../../../node_modules/@types/chai/index.d.ts" />
import "reflect-metadata";
import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as sinon from 'sinon';
chai.use(chaiAsPromised);
let expect = chai.expect, assert = chai.assert;

import * as i from '../i';
import { BrowserInputManager } from './browser-input-manager';
import { mockPathFactory, mockMessagerFactory } from '../../spec-lib';

describe(BrowserInputManager.name, () => {
    let cim: BrowserInputManager;
    let mytmp: string;

    beforeEach(() => {
        mytmp = "/my/tmp";
        cim = new BrowserInputManager(mockMessagerFactory(), mockPathFactory());
        cim.configure(mytmp);
    });


    describe(`#${BrowserInputManager.prototype.ask.name}`, () => {
        it('returns a promise for the result of launchBrowserAndServer(res, rej, config)', () => {
            let lbasStub = sinon.stub();
            let conf = { };
            cim["launchBrowserAndServer"] = lbasStub;

            let resp = cim.ask(conf);

            expect(resp.then).to.be.an.instanceOf(Function);
            sinon.assert.calledWith(lbasStub, conf, sinon.match.func, sinon.match.func);
        });
    });

    describe(`#launchBrowserAndServer`, () => {
        let exprStub: sinon.SinonStub, egetStub: sinon.SinonStub, epostStub: sinon.SinonStub, euseStub: sinon.SinonStub;
        let elistenStub: sinon.SinonStub, bpjsonStub: sinon.SinonStub, estaticStub: sinon.SinonStub;
        let joinStub: sinon.SinonStub;
        let wsnewableStub: sinon.SinonStub, wsonStub: sinon.SinonStub;
        let resStub = sinon.stub(), rejStub = sinon.stub();
        let config = { "myconfig": "neat" };
        let jsonRet = { "json": "obj" };
        let staticRet = { "static": "mock" };
        beforeEach(() => {
            exprStub = sinon.stub(), egetStub = sinon.stub(), epostStub = sinon.stub();
            elistenStub = sinon.stub(), wsnewableStub = sinon.stub(), wsonStub = sinon.stub();
            euseStub = sinon.stub(), bpjsonStub = sinon.stub(), estaticStub = sinon.stub();
            joinStub = sinon.stub();

            joinStub.returns("joined");
            cim["path"].join = joinStub;
            estaticStub.returns(staticRet);
            bpjsonStub.returns(jsonRet);
            wsnewableStub.returns({ on: wsonStub });
            exprStub.returns({
                get: egetStub,
                post: epostStub,
                use: euseStub,
                listen: elistenStub
            });
            cim.express = <any>exprStub;
            cim.express.static = <any>estaticStub;
            cim.bodyParser = <any>{ json: bpjsonStub };
            cim.webSocket = <any>{ Server: wsnewableStub };
        });

        it('should use json body parser', () => {
            cim["launchBrowserAndServer"](<any>config, resStub, rejStub);
            sinon.assert.calledWith(euseStub, jsonRet);
        });

        it('should use correct static folder', () => {
            cim["launchBrowserAndServer"](<any>config, resStub, rejStub);
            sinon.assert.calledWith(joinStub, __dirname, '..', 'browser-prompt');
            sinon.assert.calledWith(estaticStub, "joined");
            sinon.assert.calledWith(euseStub, '/', staticRet);
        });

        it('should return json question config on questions endpoint, verbatim', () => {
            let jsonStub = sinon.stub();
            jsonStub.returns(config);
            let res = { json: jsonStub };
            cim["launchBrowserAndServer"](<any>config, resStub, rejStub);
            sinon.assert.calledWith(egetStub, '/questions', sinon.match.func);
            let fn = egetStub.args[0][1];
            let resp = fn(null, res);
            expect(resp).to.deep.equal(config);
        });

        it('should accept posted data at root via curried handleUserInput', () => {
            let hui = sinon.stub();
            let req = { 1: 1 }, res = {2: 2};
            cim["handleUserInput"] = hui;
            cim["launchBrowserAndServer"](<any>config, resStub, rejStub);
            sinon.assert.calledWith(epostStub, "/", sinon.match.func);
            let fn = epostStub.args[0][1];
            fn(req, res);
            sinon.assert.calledWith(hui, resStub, rejStub, req, res);
        });

        it('should launch browser upon app listen', () => {
            let lbStub = sinon.stub();
            cim["launchBrowser"] = lbStub;
            cim["launchBrowserAndServer"](<any>config, resStub, rejStub);
            sinon.assert.calledWith(elistenStub, 3638, sinon.match.func);
            let lb = elistenStub.args[0][1];
            lb();
            sinon.assert.calledWith(lbStub, rejStub);
        });

        it('should configure wss server on express instance', () => {
            let mylistener = { 1: 2 };
            elistenStub.returns(mylistener);
            cim["launchBrowserAndServer"](<any>config, resStub, rejStub);
            sinon.assert.calledWith(wsnewableStub, sinon.match.object);
            expect(wsnewableStub.args[0][0]).to.deep.equal({ server: mylistener });
        });

        it('should launch ws server and configure connection event to route to curried wssConnection', () => {
            let wssConStub = sinon.stub();
            cim["wssConnection"] = wssConStub;
            cim["launchBrowserAndServer"](<any>config, resStub, rejStub);
            sinon.assert.calledWith(wsonStub, "connection", sinon.match.func);
            let ws = {1: 2}, req = {3: 4};
            let fn = wsonStub.args[0][1];
            fn(ws, req);
            sinon.assert.calledWith(wssConStub, resStub, rejStub, ws, req);
        });
    });

    describe('#handleUserInput', () => {
        it('resolves with entire request body and cleans up', () => {
            let biStop = sinon.stub(), siClose = sinon.stub();
            let resStub = sinon.stub(), rejStub = sinon.stub();
            cim["browserInstance"] = <any>{ stop: biStop };
            cim["serverInstance"] = <any>{ close: siClose };
            let res = {}, req = { body: "something" };

            cim["handleUserInput"](resStub, rejStub, <any>req, <any>res);

            sinon.assert.calledWith(resStub, req.body);
            expect(rejStub.called).to.be.false;
            expect(biStop.called).to.be.true;
            expect(siClose.called).to.be.true;
        });

        it('rejects on body member access error and cleans up', () => {
            let biStop = sinon.stub(), siClose = sinon.stub();
            let resStub = sinon.stub(), rejStub = sinon.stub();
            cim["browserInstance"] = <any>{ stop: biStop };
            cim["serverInstance"] = <any>{ close: siClose };
            let rejError = new Error("bad bad");
            let res = {}, req = { get body() { throw rejError; } };

            cim["handleUserInput"](resStub, rejStub, <any>req, <any>res);

            sinon.assert.calledWith(rejStub, rejError);
            expect(resStub.called).to.be.false;
            expect(biStop.called).to.be.true;
            expect(siClose.called).to.be.true;
        });
    });

    describe('#wssConnection', () => {
        it('binds message events to curried wssMessage()', () => {
            let wssmStub = sinon.stub(), onStub = sinon.stub();
            let ws = { on: onStub };
            let rejStub = sinon.stub(), resStub = sinon.stub();
            cim["wssMessage"] = wssmStub;
            let res = {}, req = { body: "something" };

            cim["wssConnection"](resStub, rejStub, ws, null);

            sinon.assert.calledWith(onStub, 'message', sinon.match.func);
            expect(onStub.calledOnce).to.be.true;
            let cb = <Function>onStub.args[0][1];
            cb('mymessage');
            sinon.assert.calledWith(wssmStub, rejStub, 'mymessage');
        });
    });

    describe('#wssMessage', () => {
        it("bad message format shouldn't cause reject or throw; could be plugin mistake, so be versatile", () => {
            let rejStub = sinon.stub();
            let message = "{ invalid json }";

            cim["wssMessage"](rejStub, message);

            expect(rejStub.called).to.be.false;
        });

        it("should reject on explicit unload message--only sent when browser closed prematurely", () => {
            let rejStub = sinon.stub();
            let message = `{ "eventType": "unload" }`;

            cim["wssMessage"](rejStub, message);

            expect(rejStub.called).to.be.true;
        });

        it("should not reject on unknown event type; be versatile", () => {
            let rejStub = sinon.stub();
            let message = `{ "eventType": "blah" }`;

            cim["wssMessage"](rejStub, message);

            expect(rejStub.called).to.be.false;
        });
    });    
});
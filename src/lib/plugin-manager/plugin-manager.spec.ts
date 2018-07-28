describe('#preparePlugins', () => {
    let configStub: sinon.SinonStub, requiregStub: sinon.SinonStub;
    beforeEach(() => {
        configStub = sinon.stub();
        requiregStub = sinon.stub();
        let plugMock = function() {};
        plugMock.prototype.configure = configStub;
        requiregStub.returns(plugMock);
        tm["requireg"] = requiregStub;
    });
    it('should yield empty plugins from empty configs def', () => {
        tm['preparePlugins'](undefined);

        expect(tm["configs"]).to.deep.equal({});
    });

    it('should add key as entry and load plugin', () => {
        tm["requireg"] = requiregStub;
        tm['preparePlugins'](<any>{ one: { plugin: "myplug" } });
        expect(tm["configs"]).to.have.property("one");
    });
    it('should rethrow nested plugin requireg error', () => {
        tm["requireg"] = () => { throw new Error("whoa") };
        expect(() => {
            tm['preparePlugins'](<any>{ one: { plugin: "myplug" } });
        }).to.throw().with.property('message').that.contains("Error loading plugin");
    });
    it('should rethrow nested plugin instantiation error', () => {
        tm["requireg"] = () => function() { throw new Error("instantiation error"); };
        expect(() => {
            tm['preparePlugins'](<any>{ one: { plugin: "myplug" } });
        }).to.throw().with.property("message").that.contains("Error instantiating plugin");
    });
    it('should rethrow nested plugin configuration error', () => {
        let throwFn = sinon.stub();
        throwFn.throws(new Error("config error"));
        tm["requireg"] = () => function() { this.configure = throwFn };
        expect(() => {
            tm['preparePlugins'](<any>{ one: { plugin: "myplug" } });
        }).to.throw().with.property("message").that.contains("calling .configure");
    });
});
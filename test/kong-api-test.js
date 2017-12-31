
let httpHelper = require('../src/http-helper'),
    KongAPI = require('../src/kong-api'),
    should = require('should'),
    sinon = require('sinon');

let getAPIStub, createAPIStub, deleteAPIStub, getPluginsStub, createPluginStub;
let sandbox;
describe('Kong API tests', () => {
    before(() => {
        sandbox = sinon.sandbox.create();
        getAPIStub = sandbox.stub(httpHelper, 'getAPI');
        createAPIStub = sandbox.stub(httpHelper, 'createAPI');
        deleteAPIStub = sandbox.stub(httpHelper, 'deleteAPI');
        getPluginsStub = sandbox.stub(httpHelper, 'getPlugins');
        createPluginStub = sandbox.stub(httpHelper, 'createPlugin');

    });
    after(() => {
        sandbox.restore();
    });
    describe('When initiating KongAPI', () => {
        it('Should throw error if kong_config not exists', () => {
            try {
                let kongAPI = new KongAPI({});
                should.fail('Should throw exception');
            } catch (err) {
                should(err).eql(new Error('kong_config & kong_config.kong_admin_api_url is mandatory'));
            }
        });

        it('Should throw error if kong_admin_api_url not exists', () => {
            try {
                let kongAPI = new KongAPI({kong_config: {}});
                should.fail('Should throw exception');
            } catch (err) {
                should(err).eql(new Error('kong_config & kong_config.kong_admin_api_url is mandatory'));
            }
        });

        it('Should not throw error if kong_admin_api_url exists', () => {
            let url = 'some-url';
            let kongAPI = new KongAPI({kong_config: { kong_admin_api_url: url }});
            should(kongAPI.kongAdminUrl).eql(url);
        });
    });

    describe.only('When calling getAPIS', () => {
        let kongAPI;
        let url = 'url';

        before(() => {
            kongAPI = new KongAPI({
                kong_config: {
                    kong_admin_api_url: url
                }
            });
        });
        afterEach(() => {
            sandbox.resetHistory();
        });

        it('should return all kong configured apis when api argument is missing', () => {
            getAPIStub.returns(Promise.resolve({
                statusCode: 200,
                body: [
                    {
                        name: 'api1'
                    },
                    {
                        name: 'api2'
                    }
                ]
            }));

            return kongAPI.getAPIs()
                .then((response) => {
                    should(getAPIStub.calledOnce).eql(true);
                    should(getAPIStub.calledWith({
                        url: url
                    })).eql(true);
                    should(response.length).eql(2);
                    should(response[0].name).eql('api1');
                    should(response[1].name).eql('api2');
                });
        });

        it.only('should return all requested apis when api argument was passed', () => {
            let getApisArgument = [
                {
                    name: 'api1'
                },
                {
                    name: 'api2'
                }
            ];

            getAPIStub.onCall(0).returns(Promise.resolve({
                statusCode: 200,
                body: {
                    name: 'api1'
                }
            }));

            getAPIStub.onCall(1).returns(Promise.resolve({
                statusCode: 200,
                body: {
                    name: 'api2'
                }
            }));

            return kongAPI.getAPIs(getApisArgument)
                .then((response) => {
                    should(getAPIStub.calledTwice).eql(true);
                    should(response.length).eql(2);
                    should(response[0].name).eql('api1');
                    should(response[1].name).eql('api2');
                });
        });
    });

    describe('When calling removeAPIs', () => {
        let kongAPI;
        let apis;
        let url = 'url', apiName = 'api-name';
        before(() => {
            kongAPI = new KongAPI({
                kong_config: {
                    kong_admin_api_url: url
                }
            });

            apis = [{
                name: apiName
            }];
        });
        afterEach(() => {
            sandbox.resetHistory();
        });
        it('Should succeed if all succeeds', () => {
            deleteAPIStub.returns(Promise.resolve({
                statusCode: 204
            }));

            return kongAPI.removeAPIs(apis)
            .then(() => {
                should(deleteAPIStub.calledOnce).eql(true);
                should(deleteAPIStub.calledWith({
                    url: url,
                    apiName: apiName
                }));
            });
        });
        it('Should succeed if all succeeds and call remove api multiple times', () => {
            apis = [
                {
                    name: apiName + '1'
                },
                {
                    name: apiName + '2'
                },
                {
                    name: apiName + '3'
                }
            ];


            deleteAPIStub.returns(Promise.resolve({
                statusCode: 204
            }));

            return kongAPI.removeAPIs(apis)
            .then(() => {
                should(deleteAPIStub.callCount).eql(3);
                for(let api of apis){
                    should(deleteAPIStub.calledWith({
                        url: url,
                        apiName: api.name
                    })).eql(true);
                }
            });

        });
        it('Should succeed if apis is empty array', () => {
            deleteAPIStub.returns(Promise.resolve({
                statusCode: 204
            }));

            return kongAPI.removeAPIs([])
            .then(() => {
                should(deleteAPIStub.callCount).eql(0);
            });

        });
        it('Should throw error if api is corrupted', () => {
            deleteAPIStub.returns(Promise.resolve({
                statusCode: 404
            }));

            return kongAPI.removeAPIs([{
                name1: 'name'
            }])
            .then(() => {
                should(deleteAPIStub.callCount).eql(1);
            });

        });
    });

    describe('When calling createPlugins', () => {
        let kongAPI;
        let plugins;
        let url = 'url', plugin = 'plugin-name', apiName = 'api';
        before(() => {
            kongAPI = new KongAPI({
                kong_config: {
                    kong_admin_api_url: url
                }
            });
        });
        beforeEach(() => {
            plugins = [{
                name: plugin
            }];
            sandbox.resetHistory();
        });
        it('Should succeed if all succeeds', () => {
            getPluginsStub.returns(Promise.resolve({
                statusCode: 200,
                body: {
                    data:[]
                }
            }));

            createPluginStub.returns(Promise.resolve({
                statusCode: 200,
                body:{
                    id: 200
                }
            }));
            return kongAPI.createPlugins(plugins, apiName)
            .then(() => {
                should(getPluginsStub.calledOnce).eql(true);
                should(createPluginStub.calledOnce).eql(true);
                should(createPluginStub.calledWith(
                    {
                        url: url,
                        apiId: apiName,
                        body: {
                            name: plugin
                        }
                    })).eql(true);
            });
        });

        it('Should succeed if all succeeds and call create plugin multiple times', () => {
            plugins = [
                {
                    name: plugin + '1'
                },
                {
                    name: plugin + '2'
                },
                {
                    name: plugin + '3'
                }
            ];
            getPluginsStub.returns(Promise.resolve({
                statusCode: 200,
                body: {
                    data:[]
                }
            }));

            createPluginStub.returns(Promise.resolve({
                statusCode: 200,
                body:{
                    id: 200
                }
            }));
            return kongAPI.createPlugins(plugins, apiName)
                .then(() => {
                    should(getPluginsStub.calledOnce).eql(true);
                    should(createPluginStub.callCount).eql(3);
                    for(let plugin of plugins){
                        should(createPluginStub.calledWith({
                            url: url,
                            apiId: apiName,
                            body: {
                                name: plugin.name
                            }
                        })).eql(true);
                    }
                });
        });
        it('Should succeed if all succeeds and plugin already exists', () => {
            getPluginsStub.returns(Promise.resolve({
                statusCode: 200,
                body: {
                    data:[{
                        id: 'id',
                        name: plugin
                    }]
                }
            }));

            createPluginStub.returns(Promise.resolve({
                statusCode: 200,
                body:{
                    id: 'id'
                }
            }));
            return kongAPI.createPlugins(plugins, apiName)
            .then(() => {
                should(getPluginsStub.calledOnce).eql(true);
                should(createPluginStub.calledOnce).eql(true);
                should(createPluginStub.calledWith({
                    url: url,
                    apiId: apiName,
                    body: {
                        id: 'id',
                        name: plugin
                    }
                })).eql(true);
            });
        });
    });

    describe('When calling createApis', () => {
        let kongAPI;
        let apis;
        let url = 'url', plugin = 'plugin-name', api = 'api';

        before(() => {
            kongAPI = new KongAPI({
                kong_config: {
                    kong_admin_api_url: url
                }
            });
        });
        beforeEach(() => {
            apis = [{
                name: api,
                plugins: [{
                    name: plugin
                }]
            }];
            sandbox.resetHistory();
        });
        it('Should succeed if all succeeds', () => {
            getAPIStub.returns(Promise.resolve({
                statusCode: 404 // not found
            }));
            getPluginsStub.returns(Promise.resolve({
                statusCode: 200,
                body: {
                    data:[]
                }
            }));
            createAPIStub.returns(Promise.resolve({
                statusCode: 200,
                body:{
                    id: 'id'
                }
            }));
            createPluginStub.returns(Promise.resolve({
                statusCode: 200,
                body:{
                    id: 'id'
                }
            }));
            return kongAPI.createApis(apis)
            .then(() => {
                should(createAPIStub.calledOnce).eql(true);
                should(createPluginStub.calledOnce).eql(true);
                should(createAPIStub.calledWith({
                    url: url,
                    body:{
                        name: api
                    }
                })).eql(true);
            });
        });
        it('Should succeed if all succeeds and api already exists', () => {
            getAPIStub.returns(Promise.resolve({
                statusCode: 200, // found,
                body:{
                    id: 'api-id'
                }
            }));
            getPluginsStub.returns(Promise.resolve({
                statusCode: 200,
                body: {
                    data:[]
                }
            }));
            createAPIStub.returns(Promise.resolve({
                statusCode: 200,
                body:{
                    id: 'id'
                }
            }));
            createPluginStub.returns(Promise.resolve({
                statusCode: 200,
                body:{
                    id: 'id'
                }
            }));
            return kongAPI.createApis(apis)
            .then(() => {
                should(createAPIStub.calledOnce).eql(true);
                should(createPluginStub.calledOnce).eql(true);
                should(createAPIStub.calledWith({
                    url: url,
                    body:{
                        id: 'api-id',
                        name: api
                    }
                })).eql(true);
            });
        });
    });

    describe('When calling createConfigurations', () => {
        let kongAPI;
        let apis;
        let url = 'url', plugin = 'plugin-name', api = 'api';

        before(() => {
            kongAPI = new KongAPI({
                kong_config: {
                    kong_admin_api_url: url,
                    apis: [{
                        name: api,
                        plugins:[{
                            name: plugin
                        }]
                    }],
                    root_plugins: [{
                        name: 'admin-' + plugin
                    }]
                }
            });
        });

        beforeEach(() => {
            sandbox.resetHistory();
        });

        it('Should succeed if all succeeds', () => {
            getAPIStub.returns(Promise.resolve({
                statusCode: 404 // not found
            }));
            getPluginsStub.returns(Promise.resolve({
                statusCode: 200,
                body: {
                    data:[]
                }
            }));
            createAPIStub.returns(Promise.resolve({
                statusCode: 200,
                body:{
                    id: 'id'
                }
            }));
            createPluginStub.returns(Promise.resolve({
                statusCode: 200,
                body:{
                    id: 'id'
                }
            }));

            return kongAPI.createConfigurations()
            .then(()=>{
                should(createAPIStub.callCount).eql(1);
                should(createPluginStub.callCount).eql(2);
            });
        });

        it('Should throw error if one of the requests fails', () => {
            getAPIStub.returns(Promise.resolve({
                statusCode: 404 // not found
            }));
            getPluginsStub.returns(Promise.resolve({
                statusCode: 200,
                body: {
                    data:[]
                }
            }));
            createAPIStub.returns(Promise.resolve({
                statusCode: 200,
                body:{
                    id: 'id'
                }
            }));
            createPluginStub.rejects(new Error('error'));

            return kongAPI.createConfigurations()
            .then(()=>{
                should.fail('Expected to throw error');
            }).catch((err) => {
                should(err).eql(new Error('error'));
            });
        });
    });
});
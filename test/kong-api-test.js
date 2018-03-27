let httpHelper = require('../src/http-helper'),
    KongAPI = require('../src/kong-api'),
    should = require('should'),
    sinon = require('sinon');

let getAPIStub, createAPIStub, deleteAPIStub, getPluginsStub, createPluginStub, deletePluginStub;
let sandbox;
describe('Kong API tests', () => {
    before(() => {
        sandbox = sinon.sandbox.create();
        getAPIStub = sandbox.stub(httpHelper, 'getAPI');
        createAPIStub = sandbox.stub(httpHelper, 'createAPI');
        deleteAPIStub = sandbox.stub(httpHelper, 'deleteAPI');
        getPluginsStub = sandbox.stub(httpHelper, 'getPlugins');
        createPluginStub = sandbox.stub(httpHelper, 'createPlugin');
        deletePluginStub = sandbox.stub(httpHelper, 'deletePlugin');
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
            let kongAPI = new KongAPI({kong_config: {kong_admin_api_url: url}});
            should(kongAPI.kongAdminUrl).eql(url);
        });
    });

    describe('When calling removeAPIs', () => {
        let kongAPI;
        let apis;
        let url = 'url', apiName = 'api-name';
        before(() => {
            kongAPI = new KongAPI({
                kong_config: {
                    kong_admin_api_url: url,
                    headers : {
                        Authorization: `Bearer sessionToken`,
                        ['x-zooz-account-id']: '*'
                    }
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

            let headers = {
                Authorization: `Bearer overRide`,
                ['x-zooz-account-id']: '*'
            };
            return kongAPI.removeAPIs(apis, headers)
                .then(() => {
                    should(deleteAPIStub.callCount).eql(3);
                    for (let api of apis) {
                        should(deleteAPIStub.calledWith({
                            url: url,
                            apiName: api.name,
                            headers: {
                                Authorization: `Bearer overRide`,
                                ['x-zooz-account-id']: '*'
                            }
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
        let url = 'url', apiName = 'api';
        before(() => {
            kongAPI = new KongAPI({
                kong_config: {
                    kong_admin_api_url: url
                }
            });
        });
        beforeEach(() => {
            sandbox.resetHistory();
        });

        it('Should succeed and only create new apis without delete', () => {
            let pluginsToCreate = [{
                name: 'plugin-name',
                config: {}
            }];

            getPluginsStub.returns(Promise.resolve({
                statusCode: 200,
                body: {
                    data: []
                }
            }));
            createPluginStub.returns(Promise.resolve({
                statusCode: 200,
                body: {
                    id: 200
                }
            }));

            return kongAPI.createPlugins(pluginsToCreate, apiName)
                .then(() => {
                    should(getPluginsStub.calledTwice).eql(true);
                    should(createPluginStub.calledOnce).eql(true);
                    should(deletePluginStub.calledOnce).eql(false);
                    should(createPluginStub.calledWith(
                        {
                            url: url,
                            apiId: apiName,
                            body: {
                                name: pluginsToCreate[0].name,
                                config: pluginsToCreate[0].config
                            }
                        })).eql(true);
                });
        });

        it('should succeed and delete one plugin from kong for specific api', () => {
            let pluginsToCreate = [{
                name: 'plugin-name',
                config: {}
            }];

            let pluginsInKong = [{
                name: 'some_plugin',
                api_id: 'some_api_id'
            }];

            getPluginsStub.returns(Promise.resolve({
                statusCode: 200,
                body: {
                    data: pluginsInKong
                }
            }));

            createPluginStub.returns(Promise.resolve({
                statusCode: 200,
                body: {
                    id: 200
                }
            }));

            deletePluginStub.returns(Promise.resolve({
                statusCode: 204
            }));

            return kongAPI.createPlugins(pluginsToCreate, apiName)
                .then(() => {
                    should(getPluginsStub.calledTwice).eql(true);
                    should(createPluginStub.calledOnce).eql(true);
                    should(deletePluginStub.calledOnce).eql(true);
                    should(createPluginStub.calledWith(
                        {
                            url: url,
                            apiId: apiName,
                            body: {
                                name: pluginsToCreate[0].name,
                                config: pluginsToCreate[0].config
                            }
                        })).eql(true);
                });

        });

        it('should succeed and delete two plugins from kong for specific api using pagination', () => {
            let pluginsToCreate = [{
                name: 'plugin-name',
                config: {}
            }];

            let pluginsInKong = [{
                name: 'some_plugin',
                api_id: 'some_api_id'
            }, {
                name: 'some_plugin2',
                api_id: 'some_app_id2'
            }];

            getPluginsStub.onCall(0).returns(Promise.resolve({
                statusCode: 200,
                body: {
                    data: [pluginsInKong[0]],
                    offset: 'some_offset'
                }
            }));

            getPluginsStub.onCall(1).returns(Promise.resolve({
                statusCode: 200,
                body: {
                    data: [pluginsInKong[1]]
                }
            }));

            getPluginsStub.onCall(2).returns(Promise.resolve({
                statusCode: 200,
                body: {
                    data: pluginsInKong
                }
            }));

            createPluginStub.returns(Promise.resolve({
                statusCode: 200,
                body: {
                    id: 200
                }
            }));

            deletePluginStub.returns(Promise.resolve({
                statusCode: 204
            }));

            return kongAPI.createPlugins(pluginsToCreate, apiName)
                .then(() => {
                    should(getPluginsStub.calledThrice).eql(true);
                    should(createPluginStub.calledOnce).eql(true);
                    should(deletePluginStub.calledTwice).eql(true);
                    should(createPluginStub.calledWith(
                        {
                            url: url,
                            apiId: apiName,
                            body: {
                                name: pluginsToCreate[0].name,
                                config: pluginsToCreate[0].config
                            }
                        })).eql(true);
                });

        });

        it('should succeed and delete two plugins from kong for root api using pagination', () => {
            let pluginsToCreate = [{
                name: 'plugin-name',
                config: {}
            }];

            let pluginsInKong = [{
                name: 'some_plugin'
            }, {
                name: 'some_plugin2'
            }];

            getPluginsStub.onCall(0).returns(Promise.resolve({
                statusCode: 200,
                body: {
                    data: [pluginsInKong[0]],
                    offset: 'some_offset'
                }
            }));

            getPluginsStub.onCall(1).returns(Promise.resolve({
                statusCode: 200,
                body: {
                    data: [pluginsInKong[1]]
                }
            }));

            getPluginsStub.onCall(2).returns(Promise.resolve({
                statusCode: 200,
                body: {
                    data: pluginsInKong
                }
            }));

            createPluginStub.returns(Promise.resolve({
                statusCode: 200,
                body: {
                    id: 200
                }
            }));

            deletePluginStub.returns(Promise.resolve({
                statusCode: 204
            }));

            return kongAPI.createPlugins(pluginsToCreate, null)
                .then(() => {
                    should(getPluginsStub.calledThrice).eql(true);
                    should(createPluginStub.calledOnce).eql(true);
                    should(deletePluginStub.calledTwice).eql(true);
                    should(createPluginStub.calledWith(
                        {
                            url: url,
                            apiId: null,
                            body: {
                                name: pluginsToCreate[0].name,
                                config: pluginsToCreate[0].config
                            }
                        })).eql(true);
                });

        });

        it('Should succeed if all succeeds and call create plugin multiple times', () => {
            let pluginsToCreate = [
                {
                    name: 'plugin1'
                },
                {
                    name: 'plugin2'
                },
                {
                    name: 'plugin3'
                }
            ];
            getPluginsStub.returns(Promise.resolve({
                statusCode: 200,
                body: {
                    data: []
                }
            }));

            createPluginStub.returns(Promise.resolve({
                statusCode: 200,
                body: {
                    id: 200
                }
            }));

            return kongAPI.createPlugins(pluginsToCreate, apiName)
                .then(() => {
                    should(createPluginStub.callCount).eql(3);
                    for (let plugin of pluginsToCreate) {
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
    });

    describe('When calling getPluginsOfExistApi', () => {
        let kongAPI;
        let url = 'url', apiName = 'api';
        before(() => {
            kongAPI = new KongAPI({
                kong_config: {
                    kong_admin_api_url: url
                }
            });

        });
        beforeEach(() => {
            sandbox.resetHistory();
        });

        it('Should succeed and get plugins', () => {
            let plugin1 = {
                name: "first plugin"
            };
            getPluginsStub.onFirstCall().returns(Promise.resolve({
                statusCode: 200,
                body: {
                    data: [plugin1]
                },
                headers: {
                    "Authorization": "Bearer undefined"
                }
            }));


            return kongAPI.getPluginsOfExistApi(apiName)
                .then((res) => {
                    should(getPluginsStub.calledOnce).eql(true);
                    should(res).eql([plugin1]);
                    should(getPluginsStub.args[0][0]).eql({
                        url: 'url', size: 100, apiId: 'api', offset: undefined
                    })
                });
        });
        it('Should succeed and get plugins with offest', () => {
            let plugin1 = {
                name: "first plugin"
            };
            let plugin2 = {
                name: "second plugin"
            };
            getPluginsStub.onFirstCall().returns(Promise.resolve({
                statusCode: 200,
                body: {
                    data: [plugin1],
                    offset: 'some_offset'
                }
            }));
            getPluginsStub.onSecondCall().returns(Promise.resolve({
                statusCode: 200,
                body: {
                    data: [plugin2]
                },
                headers: {
                    "Authorization": "Bearer undefined"
                }
            }));


            return kongAPI.getPluginsOfExistApi(apiName)
                .then((res) => {
                    should(getPluginsStub.calledTwice).eql(true);
                    should(res).eql([plugin1, plugin2]);
                    should(getPluginsStub.args[0][0]).eql({url: 'url', size: 100, apiId: 'api', offset: undefined});
                    should(getPluginsStub.args[1][0]).eql({
                        url: 'url',
                        size: 100,
                        apiId: 'api',
                        offset: "some_offset",
                    });
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
            sandbox.resetHistory();
            apis = [{
                name: api,
                plugins: [{
                    name: plugin
                }]
            }];
        });
        it('Should succeed if all succeeds', () => {
            getAPIStub.returns(Promise.resolve({
                statusCode: 404 // not found
            }));
            getPluginsStub.returns(Promise.resolve({
                statusCode: 200,
                body: {
                    data: []
                }
            }));
            createAPIStub.returns(Promise.resolve({
                statusCode: 200,
                body: {
                    id: 'id'
                }
            }));
            createPluginStub.returns(Promise.resolve({
                statusCode: 200,
                body: {
                    id: 'id'
                }
            }));
            return kongAPI.createApis(apis)
                .then(() => {
                    should(createAPIStub.calledOnce).eql(true);
                    should(createPluginStub.calledOnce).eql(true);
                    should(createAPIStub.calledWith({
                        url: url,
                        body: {
                            name: api
                        }
                    })).eql(true);
                });
        });
        it('Should succeed if all succeeds and api already exists', () => {
            getAPIStub.returns(Promise.resolve({
                statusCode: 200, // found,
                body: {
                    id: 'api-id'
                }
            }));
            getPluginsStub.returns(Promise.resolve({
                statusCode: 200,
                body: {
                    data: []
                }
            }));
            createAPIStub.returns(Promise.resolve({
                statusCode: 200,
                body: {
                    id: 'id'
                }
            }));
            createPluginStub.returns(Promise.resolve({
                statusCode: 200,
                body: {
                    id: 'id'
                }
            }));

            return kongAPI.createApis(apis)
                .then(() => {
                    should(createAPIStub.calledOnce).eql(true);
                    should(createPluginStub.calledOnce).eql(true);
                    should(createAPIStub.calledWith({
                        url: url,
                        body: {
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
                        plugins: [{
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
                    data: []
                }
            }));
            createAPIStub.returns(Promise.resolve({
                statusCode: 200,
                body: {
                    id: 'id'
                }
            }));
            createPluginStub.returns(Promise.resolve({
                statusCode: 200,
                body: {
                    id: 'id'
                }
            }));

            return kongAPI.createConfigurations()
                .then(() => {
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
                    data: []
                }
            }));
            createAPIStub.returns(Promise.resolve({
                statusCode: 200,
                body: {
                    id: 'id'
                }
            }));
            createPluginStub.rejects(new Error('error'));

            return kongAPI.createConfigurations()
                .then(() => {
                    should.fail('Expected to throw error');
                }).catch((err) => {
                    should(err).eql(new Error('error'));
                });
        });
    });

    describe('When calling getAPIS', () => {
        let kongAPI;
        let url = 'url';

        before(() => {
            sandbox.resetHistory();
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
                        url: url,
                        queryParams: undefined
                    })).eql(true);
                    should(response.length).eql(2);
                    should(response[0].name).eql('api1');
                    should(response[1].name).eql('api2');
                });
        });

        it('should return all kong configured apis when api argument is missing. options is object with query params', () => {
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

            return kongAPI.getAPIs(null, {queryParams: 'queryParams'})
                .then((response) => {
                    should(getAPIStub.calledOnce).eql(true);
                    should(getAPIStub.calledWith({
                        url: url,
                        queryParams: 'queryParams'
                    })).eql(true);
                    should(response.length).eql(2);
                    should(response[0].name).eql('api1');
                    should(response[1].name).eql('api2');
                });
        });

        it('should return all requested apis when api argument was passed', () => {
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
});
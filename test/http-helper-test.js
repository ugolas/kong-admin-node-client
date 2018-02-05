let request = require('request-promise'),
    httpHelper = require('../src/http-helper'),
    should = require('should'),
    sinon = require('sinon');

describe.only('HTTP helper test', () => {
    let getStub, putStub, deleteStub;
    let sandbox;
    let url = 'url';
    let name = 'name';
    let sampleBody = {
        name
    };
    before(() => {
        sandbox = sinon.sandbox.create();

        getStub = sandbox.stub(request, 'get');
        putStub = sandbox.stub(request, 'put');
        deleteStub = sandbox.stub(request, 'delete');
    });
    after(() => {
        sandbox.restore();
    });
    describe('When calling createAPI', () => {
        beforeEach(() => {
            sandbox.resetHistory();
        });
        it('Should succeed if success', () => {
            putStub.returns(Promise.resolve({
                statusCode: 200
            }));

            return httpHelper.createAPI({
                url: url,
                body: sampleBody
            }).then(() => {
                should(putStub.calledOnce).eql(true);
                should(putStub.calledWith({
                    'content-type': 'application/json',
                    resolveWithFullResponse: true,
                    json: true,
                    simple: false,
                    uri: url + '/apis',
                    body: sampleBody
                })).eql(true);
            });
        });
        it('Should throw error if status code is wrong', () => {
            putStub.returns(Promise.resolve({
                statusCode: 400
            }));

            return httpHelper.createAPI({
                url: url,
                body: sampleBody
            }).catch((err) => {
                should(err).eql(new Error('Error in calling url/apis'));
                should(putStub.calledOnce).eql(true);
                should(putStub.calledWith({
                    'content-type': 'application/json',
                    resolveWithFullResponse: true,
                    json: true,
                    simple: false,
                    uri: url + '/apis',
                    body: sampleBody
                })).eql(true);
            });
        });
    });
    describe('When calling deleteAPI', () => {
        beforeEach(() => {
            sandbox.resetHistory();
        });
        it('Should succeed if success', () => {
            deleteStub.returns(Promise.resolve({
                statusCode: 204
            }));

            return httpHelper.deleteAPI({
                url: url,
                apiName: name
            }).then(() => {
                should(deleteStub.calledOnce).eql(true);
                should(deleteStub.calledWith({
                    'content-type': 'application/json',
                    resolveWithFullResponse: true,
                    json: true,
                    simple: false,
                    uri: url + '/apis/' + name
                })).eql(true);
            });
        });
        it('Should throw error if status code is wrong', () => {
            deleteStub.returns(Promise.resolve({
                statusCode: 400
            }));

            return httpHelper.deleteAPI({
                url: url,
                apiName: name
            }).catch((err) => {
                should(err).eql(new Error('Error in calling url/apis/name'));
                should(deleteStub.calledOnce).eql(true);
                should(deleteStub.calledWith({
                    'content-type': 'application/json',
                    resolveWithFullResponse: true,
                    json: true,
                    simple: false,
                    uri: url + '/apis/' + name
                })).eql(true);
            });
        });
    });
    describe.only('When calling getAPI', () => {
        beforeEach(() => {
            sandbox.resetHistory();
        });
        it('Should succeed if success', () => {
            getStub.returns(Promise.resolve({
                statusCode: 200
            }));

            return httpHelper.getAPI({
                url: url,
                apiName: name
            }).then(() => {
                should(getStub.calledOnce).eql(true);
                should(getStub.calledWith({
                    'content-type': 'application/json',
                    resolveWithFullResponse: true,
                    json: true,
                    simple: false,
                    uri: url + '/apis/' + name
                })).eql(true);
            });
        });
        it('Should succeed if success with query params', () => {
            getStub.returns(Promise.resolve({
                statusCode: 200
            }));

            return httpHelper.getAPI({
                url: url,
                apiName: name,
                queryParams: [
                    {
                        key: 'key1',
                        value: 'value1'
                    }
                ]
            }).then(() => {
                should(getStub.calledOnce).eql(true);
                should(getStub.calledWith({
                    'content-type': 'application/json',
                    resolveWithFullResponse: true,
                    json: true,
                    simple: false,
                    uri: url + '/apis/' + name
                })).eql(true);
            });
        });
        it('Should throw error if status code is wrong', () => {
            getStub.returns(Promise.resolve({
                statusCode: 400
            }));

            return httpHelper.getAPI({
                url: url,
                apiName: name
            }).catch((err) => {
                should(err).eql(new Error('Error in calling url/apis/name'));
                should(getStub.calledOnce).eql(true);
                should(getStub.calledWith({
                    'content-type': 'application/json',
                    resolveWithFullResponse: true,
                    json: true,
                    simple: false,
                    uri: url + '/apis/' + name
                })).eql(true);
            });
        });
    });
    describe('When calling createPlugin', () => {
        beforeEach(() => {
            sandbox.resetHistory();
        });
        it('Should succeed if success', () => {
            putStub.returns(Promise.resolve({
                statusCode: 200
            }));

            return httpHelper.createPlugin({
                url: url,
                apiId: name,
                body: sampleBody
            }).then(() => {
                should(putStub.calledOnce).eql(true);
                should(putStub.calledWith({
                    'content-type': 'application/json',
                    resolveWithFullResponse: true,
                    json: true,
                    simple: false,
                    uri: url + '/apis/' + name + '/plugins',
                    body: sampleBody
                })).eql(true);
            });
        });
        it('Should throw error if status code is wrong', () => {
            putStub.returns(Promise.resolve({
                statusCode: 400
            }));

            return httpHelper.createPlugin({
                url: url,
                apiId: name,
                body: sampleBody
            }).catch((err) => {
                should(err).eql(new Error('Error in calling url/apis/name/plugins'));
                should(putStub.calledOnce).eql(true);
                should(putStub.calledWith({
                    'content-type': 'application/json',
                    resolveWithFullResponse: true,
                    json: true,
                    simple: false,
                    uri: url + '/apis/' + name + '/plugins',
                    body: sampleBody
                })).eql(true);
            });
        });
    });
    describe('When calling getPlugin', () => {
        beforeEach(() => {
            sandbox.resetHistory();
        });
        it('Should succeed if success', () => {
            getStub.returns(Promise.resolve({
                statusCode: 200
            }));

            return httpHelper.getPlugin({
                url: url,
                pluginName: name,
                apiId: name
            }).then(() => {
                should(getStub.calledOnce).eql(true);
                should(getStub.calledWith({
                    'content-type': 'application/json',
                    resolveWithFullResponse: true,
                    json: true,
                    simple: false,
                    uri: url + '/apis/' + name + '/plugins/' + name
                })).eql(true);
            });
        });
        it('Should throw error if status code is wrong', () => {
            getStub.returns(Promise.resolve({
                statusCode: 400
            }));

            return httpHelper.getPlugin({
                url: url,
                pluginName: name,
                apiId: name
            }).catch((err) => {
                should(err).eql(new Error('Error in calling url/apis/name/plugins/name'));
                should(getStub.calledOnce).eql(true);
                should(getStub.calledWith({
                    'content-type': 'application/json',
                    resolveWithFullResponse: true,
                    json: true,
                    simple: false,
                    uri: url + '/apis/' + name + '/plugins/' + name
                })).eql(true);
            });
        });
    });
    describe('When calling getPlugins', () => {
        beforeEach(() => {
            sandbox.resetHistory();
        });
        it('Should succeed if success', () => {
            getStub.returns(Promise.resolve({
                statusCode: 200
            }));

            return httpHelper.getPlugins({
                url: url,
                apiId: name
            }).then(() => {
                should(getStub.calledOnce).eql(true);
                should(getStub.calledWith({
                    'content-type': 'application/json',
                    resolveWithFullResponse: true,
                    json: true,
                    simple: false,
                    uri: url + '/apis/' + name + '/plugins/'
                })).eql(true);
            });
        });
        it('Should throw error if status code is wrong', () => {
            getStub.returns(Promise.resolve({
                statusCode: 400
            }));

            return httpHelper.getPlugins({
                url: url,
                apiId: name
            }).catch((err) => {
                should(err).eql(new Error('Error in calling url/apis/name/plugins/'));
                should(getStub.calledOnce).eql(true);
                should(getStub.calledWith({
                    'content-type': 'application/json',
                    resolveWithFullResponse: true,
                    json: true,
                    simple: false,
                    uri: url + '/apis/' + name + '/plugins/'
                })).eql(true);
            });
        });
    });
});
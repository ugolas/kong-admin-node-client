let request = require('request-promise'),
    httpHelper = require('../src/http-helper'),
    logger = require('../src/logger'),
    common = require('../src/common'),
    should = require('should'),
    sinon = require('sinon');

describe('HTTP helper test', () => {
    let getStub, putStub, infoStub, deleteStub;
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
        infoStub = sandbox.stub(logger, 'info');
        deleteStub = sandbox.stub(request, 'delete');
    });
    after(() => {
        sandbox.restore();
    });
    describe('When calling createAPI', () => {
        beforeEach(() => {
            sandbox.resetHistory();
        });
        it('Should succeed if success and mask required fields.', () => {
            putStub.returns(Promise.resolve({
                statusCode: 200
            }));

            common.MASKING_FIELDS = common.MASKING_FIELDS.concat(["trymasking"]);

            return httpHelper.createAPI({
                url: url,
                body: sampleBody,
                headers: {
                    "Authorization": "Bearer try",
                    "tryMasking" : "hey"
                }
            }).then(() => {
                should(putStub.calledOnce).eql(true);
                should(infoStub.args[0][0]).eql({
                    "req": {
                        "body": {
                            "name": "name"
                        },
                        "headers": {
                            "Authorization": "XXXXX",
                            "tryMasking": "XXXXX"
                        },
                        "uri": "url/apis"
                    }
                });
                should(putStub.calledWith({
                    'content-type': 'application/json',
                    resolveWithFullResponse: true,
                    json: true,
                    simple: false,
                    uri: url + '/apis',
                    body: sampleBody,
                    headers: {
                        "Authorization": "Bearer try",
                        "tryMasking": "hey"
                    }
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
                    body: sampleBody,
                    headers: undefined
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
                apiName: name,
                headers: {
                    "Authorization": "Bearer try"
                }
            }).then(() => {
                should(deleteStub.calledOnce).eql(true);
                should(deleteStub.calledWith({
                    'content-type': 'application/json',
                    resolveWithFullResponse: true,
                    json: true,
                    simple: false,
                    uri: url + '/apis/' + name,
                    headers: {
                        "Authorization": "Bearer try"
                    }
                })).eql(true);
            });
        });
        it('Should throw error if status code is wrong', () => {
            deleteStub.returns(Promise.resolve({
                statusCode: 400
            }));

            return httpHelper.deleteAPI({
                url: url,
                apiName: name,
                headers: {
                    "Authorization": "Bearer try"
                }
            }).catch((err) => {
                should(err).eql(new Error('Error in calling url/apis/name'));
                should(deleteStub.calledOnce).eql(true);
                should(deleteStub.calledWith({
                    'content-type': 'application/json',
                    resolveWithFullResponse: true,
                    json: true,
                    simple: false,
                    uri: url + '/apis/' + name,
                    headers: {
                        "Authorization": "Bearer try"
                    }
                })).eql(true);
            });
        });
    });
    describe('When calling getAPI', () => {
        beforeEach(() => {
            sandbox.resetHistory();
        });
        it('Should succeed if success', () => {
            getStub.returns(Promise.resolve({
                statusCode: 200
            }));

            return httpHelper.getAPI({
                url: url,
                apiName: name,
                headers: {
                    "Authorization": "Bearer try"
                }
            }).then(() => {
                should(getStub.calledOnce).eql(true);
                should(getStub.calledWith({
                    'content-type': 'application/json',
                    resolveWithFullResponse: true,
                    json: true,
                    simple: false,
                    uri: url + '/apis/' + name,
                    headers: {
                        "Authorization": "Bearer try"
                    }
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
                queryParams: {
                    name: 'value'
                }
            }).then(() => {
                should(getStub.calledOnce).eql(true);
                should(getStub.calledWith({
                    'content-type': 'application/json',
                    resolveWithFullResponse: true,
                    json: true,
                    simple: false,
                    uri: url + '/apis/' + name,
                    qs: {
                        name: 'value'
                    },
                    headers: undefined
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
                    uri: url + '/apis/' + name,
                    headers: undefined
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
                body: sampleBody,
                headers: {
                    "Authorization": "Bearer try"
                }
            }).then(() => {
                should(putStub.calledOnce).eql(true);
                should(putStub.calledWith({
                    'content-type': 'application/json',
                    resolveWithFullResponse: true,
                    json: true,
                    simple: false,
                    uri: url + '/apis/' + name + '/plugins',
                    body: sampleBody,
                    headers: {
                        "Authorization": "Bearer try"
                    }
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
                    body: sampleBody,
                    headers: undefined
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
                apiId: name,
                headers: {
                    "Authorization": "Bearer try"
                }
            }).then(() => {
                should(getStub.calledOnce).eql(true);
                should(getStub.calledWith({
                    'content-type': 'application/json',
                    resolveWithFullResponse: true,
                    json: true,
                    simple: false,
                    uri: url + '/apis/' + name + '/plugins/' + name,
                    headers: {
                        "Authorization": "Bearer try"
                    }
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
                    uri: url + '/apis/' + name + '/plugins/' + name,
                    headers: undefined
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
                apiId: name,
                headers: {
                    "Authorization": "Bearer try"
                }
            }).then(() => {
                should(getStub.calledOnce).eql(true);
                should(getStub.calledWith({
                    'content-type': 'application/json',
                    resolveWithFullResponse: true,
                    json: true,
                    simple: false,
                    uri: url + '/apis/' + name + '/plugins/',
                    headers: {
                        "Authorization": "Bearer try"
                    }
                })).eql(true);
            });
        });

        it('Should succeed with all query params', () => {
            getStub.returns(Promise.resolve({
                statusCode: 200
            }));

            return httpHelper.getPlugins({
                url: url,
                apiId: name,
                pluginName: 'some_name',
                size: 10,
                offset: 'some_offset'
            }).then(() => {
                should(getStub.calledOnce).eql(true);
                should(getStub.calledWith({
                    'content-type': 'application/json',
                    resolveWithFullResponse: true,
                    json: true,
                    simple: false,
                    uri: url + '/apis/' + name + '/plugins/',
                    qs: {
                        name: 'some_name',
                        size: 10,
                        offset: 'some_offset'
                    },
                    headers: undefined
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
                    uri: url + '/apis/' + name + '/plugins/',
                    headers: undefined
                })).eql(true);
            });
        });
    });

    describe('When calling deletePlugin', () => {

    });
});
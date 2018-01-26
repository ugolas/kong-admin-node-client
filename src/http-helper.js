let _ = require('lodash'),
    logger = require('./logger'),
    request = require('request-promise');

let createAPI = function ({ url, body }) {
    let options = {
        uri: `${url}/apis`,
        body: body
    };
    logger.info({ req: options }, 'createAPI');
    var requestOptions = _.assign(options, basicRequest);
    return sendRequestAndProcessError(request.put, requestOptions, [200, 201]);
};

let deleteAPI = function ({ url, apiName }) {
    let options = {
        uri: `${url}/apis/${apiName}`
    };
    logger.info({ req: options }, 'deleteAPI');
    var requestOptions = _.assign(options, basicRequest);
    return sendRequestAndProcessError(request.delete, requestOptions, [204, 404]);
};

let getAPI = function ({ url, apiName }) {
    let options = {
        uri: `${url}/apis`
    };

    if (apiName) {
        options.uri += `/${apiName}`;
    }

    logger.info({ req: options }, 'getAPI');
    let requestOptions = _.assign(options, basicRequest);
    return sendRequestAndProcessError(request.get, requestOptions, [200, 404]);
};

let createPlugin = function ({ url, apiId, body }) {
    let options = {
        uri: apiId ? `${url}/apis/${apiId}/plugins` : `${url}/plugins`,
        body: body
    };
    logger.info({ req: options }, 'createPlugin');
    var requestOptions = _.assign(options, basicRequest);
    return sendRequestAndProcessError(request.put, requestOptions, [200, 201]);
};

let getPlugin = function ({ url, pluginName, apiId }) {
    let options = {
        uri: apiId ? `${url}/apis/${apiId}/plugins/${pluginName}` : `${url}/plugins/${pluginName}`
    };
    logger.info({ req: options }, 'getPlugin');
    var requestOptions = _.assign(options, basicRequest);
    return sendRequestAndProcessError(request.get, requestOptions, [200]);
};

let getPlugins = function ({ url, apiId, pluginName }) {
    let options = {
        uri: apiId ? `${url}/apis/${apiId}/plugins/` : `${url}/plugins/`
    };

    if (pluginName){
        options.qs = {
            name: pluginName
        };
    }

    logger.info({ req: options }, 'getPlugins');
    var requestOptions = _.assign(options, basicRequest);
    return sendRequestAndProcessError(request.get, requestOptions, [200]);
};

let sendRequestAndProcessError = function (requestMethod, options, expectedStatuses) {
    return requestMethod(options)
        .then((res) => {
            if (!expectedStatuses.includes(res.statusCode)) {
                logger.error(`Error during operation, expected status ${expectedStatuses}, got: ${res.statusCode}`);
                logger.error(`Error body: ${JSON.stringify(res.body)}`);
                throw new Error(`Error in calling ${options.uri}`);
            }

            return res;
        });
};

let basicRequest = {
    'content-type': 'application/json',
    resolveWithFullResponse: true,
    json: true,
    simple: false
};

module.exports = {
    createAPI: createAPI,
    getAPI: getAPI,
    deleteAPI: deleteAPI,
    createPlugin: createPlugin,
    getPlugin: getPlugin,
    getPlugins: getPlugins
};
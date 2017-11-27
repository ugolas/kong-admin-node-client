let _ = require('lodash'),
    logger = require('./logger'),
    request = require('request-promise');

let createAPI = function ({
    url,
    body
}) {
    let options = {
        method: 'PUT',
        uri: `${url}/apis`,
        body: body
    };

    var requestOptions = _.assign(options, basicRequest);
    return sendRequestAndProcessError(requestOptions, [200, 201])
};

let getAPI = function ({
    url,
    apiName
}) {
    let options = {
        method: 'GET',
        uri: `${url}/apis/${apiName}`
    };

    var requestOptions = _.assign(options, basicRequest);

    return sendRequestAndProcessError(requestOptions, [200, 404])
}

let createPlugin = function ({
    url,
    apiId,
    body
}) {
    let options = {
        method: 'PUT',
        uri: apiId ? `${url}/apis/${apiId}/plugins` : `${url}/plugins`,
        body: body
    };

    var requestOptions = _.assign(options, basicRequest);
    return sendRequestAndProcessError(requestOptions, [200, 201])
}

let getPlugin = function ({
    url,
    pluginName,
    apiId
}) {
    let options = {
        method: 'GET',
        uri: apiId ? `${url}/apis/${apiId}/plugins/${pluginName}` : `${url}/plugins/${pluginName}`
    };

    var requestOptions = _.assign(options, basicRequest);
    return sendRequestAndProcessError(requestOptions, [200])
}

let getPlugins = function ({
    url,
    apiId
}) {
    let options = {
        method: 'GET',
        uri: apiId ? `${url}/apis/${apiId}/plugins/` : `${url}/plugins/`
    };

    var requestOptions = _.assign(options, basicRequest);
    return sendRequestAndProcessError(requestOptions, [200])

}

let sendRequestAndProcessError = function (options, expectedStatuses) {
    return request(options)
        .then((res) => {
            if (!expectedStatuses.includes(res.statusCode)) {
                logger.error(`Error during get plugin, expected status ${expectedStatuses}, got: ${res.statusCode}`)
                logger.error(`Error body: ${JSON.stringify(res.body)}`)
                throw new Error(`Error in ${options.method}, ${options.uri}`)
            }

            return res;
        });
}

let basicRequest = {
    'content-type': 'application/json',
    resolveWithFullResponse: true,
    json: true,
    simple: false
};

module.exports = {
    createAPI: createAPI,
    getAPI: getAPI,
    createPlugin: createPlugin,
    getPlugin: getPlugin,
    getPlugins: getPlugins
};
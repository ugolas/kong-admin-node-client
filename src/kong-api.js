let httpHelper = require('./http-helper'),
    common = require('./common'),
    _ = require('lodash'),
    logger = require('./logger');

class KongAPI {
    constructor(options) {
        if (!options.kong_config || !options.kong_config.kong_admin_api_url) {
            throw new Error('kong_config & kong_config.kong_admin_api_url is mandatory');
        }

        this.kong_config = options.kong_config;
        this.headers = options.headers;
        this.kongAdminUrl = this.kong_config.kong_admin_api_url;
        common.MASKING_FIELDS = common.MASKING_FIELDS.concat(options.headers_to_mask || []);
    }

    async createConfigurations() {
        let kongAdminUrl = this.kong_config.kong_admin_api_url;

        logger.info(`Starting Kong configuration, kong admin url: ${kongAdminUrl}`);
        let apis = this.kong_config.apis;
        let rootPlugins = this.kong_config.root_plugins;
        try {
            // Create APIs
            if (apis && apis.length > 0) {
                await this.createApis(apis);
            }

            // Config root plugins:
            if (rootPlugins && rootPlugins.length > 0) {
                await this.createPlugins(rootPlugins);
            }
        } catch (err) {
            logger.error(err.message, 'Error during configuration creation');
            throw (err);
        }

        logger.info('Successfully completed configuration');
    }

    async createApis(apis, headers) {
        logger.info(`Setting up apis, ${apis.length} in total`);
        for (let api of apis) {
            // Clone the API object to delete the plugins from the request body:
            let apiPlugins = api.plugins;
            delete api.plugins;

            logger.info(`Setting up api: ${api.name}, ${apis.indexOf(api) + 1} out of ${apis.length} apis`);

            // Check if exists
            let getApiRequest = {
                url: this.kongAdminUrl,
                apiName: api.name,
            };

            getApiRequest = addHeadersToRequest(this.headers, headers, getApiRequest);

            let getResponse = await httpHelper.getAPI(getApiRequest);


            // If API exists
            if (getResponse.statusCode === 200) {
                logger.info(`api: ${api.name} already exists, updating it's configuration`);
                // Add Id to request so it will update the resource
                api = _.defaults(api, getResponse.body);
            }

            let createApiRequest = {
                url: this.kongAdminUrl,
                body: api,
            };
            createApiRequest = addHeadersToRequest(this.headers, headers, createApiRequest);
            let response = await httpHelper.createAPI(createApiRequest);

            let apiId = response.body.id;
            logger.info(`Configuration for api: ${api.name} set up successfully: ${apiId}`);

            // Create plugins for API
            if (apiPlugins) {
                await this.createPlugins(apiPlugins, api.name);
            }
        }
    }

    async getAPIs(apis, options, headers) {
        let getResponse = [];
        apis = Array.isArray(apis) ? apis : [];

        if (apis.length === 0) {
            // Get all configured API's
            let getApiRequest = {
                url: this.kongAdminUrl,
                queryParams: options && typeof options === 'object' && options.queryParams,
            };

            getApiRequest = addHeadersToRequest(this.headers, headers, getApiRequest);

            let response = await httpHelper.getAPI(getApiRequest);

            if (response.statusCode === 200) {
                getResponse = response.body;
            }

            return getResponse;
        }

        for (let i = 0; i < apis.length; i++) {
            let api = apis[i];

            if (!api.name) {
                logger.info('skip api since no api name was found. api:' + JSON.stringify(api));
                continue;
            }

            logger.info(`getting api: ${api.name}, ${apis.indexOf(api) + 1} out of ${apis.length} apis`);


            let getApiRequest = {
                url: this.kongAdminUrl,
                apiName: api.name,
            };
            getApiRequest = addHeadersToRequest(this.headers, headers, getApiRequest);

            let response = await httpHelper.getAPI(getApiRequest);

            if (response.statusCode === 200) {
                getResponse.push(response.body);
            }
        }

        return getResponse;
    }

    async removeAPIs(apis, headers) {
        logger.info(`Removing apis from kong, ${apis.length} in total`);
        for (let api of apis) {
            logger.info(`Removing api: ${api.name}, ${apis.indexOf(api) + 1} out of ${apis.length} apis`);

            // Check if exists
            let deleteApiRequest = {
                url: this.kongAdminUrl,
                apiName: api.name,
            };
            deleteApiRequest = addHeadersToRequest(this.headers, headers, deleteApiRequest);

            let removeResponse = await httpHelper.deleteAPI(deleteApiRequest);

            if (removeResponse.statusCode === 404) {
                logger.info(`API ${api.name} not found. Skipping it.`);
            }

            logger.info(`Configuration for api: ${api.name} was removed successfully`);
        }
    }

    async removePlugins(plugins, apiName, headers) {
        logger.info(apiName ? `Removing plugins from kong api: ${apiName}. ${plugins.length} in total` : `Removing plugins from kong in root api. ${plugins.length} in total`);
        for (let i = 0; i < plugins.length; i++) {
            let plugin = plugins[i];
            logger.info(`Removing plugin: ${plugin.name}, ${plugins.indexOf(plugin) + 1} out of ${plugins.length} plugins`);

            let deletePluginRequest = {
                url: this.kongAdminUrl,
                apiName: apiName,
                pluginId: plugin.id

            };
            deletePluginRequest = addHeadersToRequest(this.headers, headers, deletePluginRequest);

            let removeResponse = await httpHelper.deletePlugin(deletePluginRequest);

            if (removeResponse.statusCode === 404) {
                logger.info(`API ${plugin.name} not found. Skipping it.`);
            }

            logger.info(apiName ? `Removing plugin for api: ${apiName} was finished successfully. plugin name: ${plugin.name}` : `Removing plugin for root api was finished successfully. plugin name: ${plugin.name}`);
        }
    }

    async createPlugins(plugins, apiName, headers) {
        logger.info(apiName ? `Setting up plugins in api: ${apiName}, ${plugins.length} in total` : `Setting up plugins, ${plugins.length} in total`);

        let pluginsToDelete = await getPluginsToDelete(this.kongAdminUrl, plugins, apiName, this.headers, headers);

        // Create or update plugins
        for (let plugin of plugins) {
            logger.info(apiName ? `Setting up plugin: ${plugin.name} in api: ${apiName}, ${plugins.indexOf(plugin) + 1} out of ${plugins.length} plugins` : `Setting up plugin: ${plugin.name}, ${plugins.indexOf(plugin) + 1} out of ${plugins.length}  plugins`);

            // Try finding existing plugin
            let getPluginRequest = {
                url: this.kongAdminUrl,
                apiId: apiName,
                pluginName: plugin.name
            };
            getPluginRequest = addHeadersToRequest(this.headers, headers, getPluginRequest);

            let getPluginsResponse = await httpHelper.getPlugins(getPluginRequest);

            let existingPlugins = getPluginsResponse.body.data;
            let existingPlugin;
            // Add Id to request so it will update the resource
            if (existingPlugins.length > 0) {
                existingPlugin = _.find(existingPlugins, function (element) {
                    return element.name === plugin.name;
                });

                // If plugin exists
                if (existingPlugin) {
                    logger.info(apiName ? `Plugin: ${plugin.name} in api: ${apiName}' already exists, updating it's configuration` : `Plugin: ${plugin.name} already exists, updating it's configuration`);
                    plugin = _.defaults(plugin, existingPlugin);
                } else {
                    logger.info(apiName ? `Plugin: ${plugin.name} in api: ${apiName}' does not exists, creating it` : `Plugin: ${plugin.name} does not exists, creating it`);
                }
            }

            let createPluginRequest = {
                url: this.kongAdminUrl,
                apiId: apiName,
                body: plugin
            };
            createPluginRequest = addHeadersToRequest(this.headers, headers, createPluginRequest);

            let response = await httpHelper.createPlugin(createPluginRequest);

            logger.info(`Configuration for plugin: ${plugin.name} set up successfully: ${response.body.id}`);
        }

        // delete plugins
        if (pluginsToDelete.length > 0) {
            await this.removePlugins(pluginsToDelete, apiName);
        }
    }

    async getPluginsOfExistApi(apiName, headers) {
        if (apiName) {
            let plugins = [];

            let offset = undefined;
            let done = false;

            // browse through the plugins list using pagination.
            //  each page contains @size plugins. any plugin from kong that does not appear
            // in the new plugins list will be mark as deleted
            while (!done) {
                let getPluginsRequest = {
                    url: this.kongAdminUrl,
                    size: 100
                };

                getPluginsRequest = addHeadersToRequest(this.headers, headers, getPluginsRequest);

                getPluginsRequest.apiId = apiName;
                getPluginsRequest.offset = offset;

                let getPluginsResponse = await httpHelper.getPlugins(getPluginsRequest);

                getPluginsResponse.body.data.forEach((plugin) => {
                    plugins.push(plugin);
                });


                offset = getPluginsResponse.body.offset;

                if (!offset) {
                    done = true;
                }
            }

            return plugins;
        }
    }
}

function addHeadersToRequest(constructorHeaders, overrideHeaders, request) {
    let headers = overrideHeaders || constructorHeaders;

    if (headers) {
        request.headers = headers;
    }

    return request;
}

async function getPluginsToDelete(kongAdminUrl, plugins, apiName, constructorHeaders, overrideHeaders) {
    let pluginsToDelete = [];

    let offset = undefined;
    let done = false;

    // browse through the plugins list using pagination.
    //  each page contains @size plugins. any plugin from kong that does not appear
    // in the new plugins list will be mark as deleted
    while (!done) {
        let getPluginsRequest = {
            url: kongAdminUrl,
            size: 100,
        };
        getPluginsRequest = addHeadersToRequest(constructorHeaders, overrideHeaders, getPluginsRequest);

        if (apiName) getPluginsRequest.apiId = apiName;
        getPluginsRequest.offset = offset;

        let getPluginsResponse = await httpHelper.getPlugins(getPluginsRequest);

        if (apiName) {
            getPluginsResponse.body.data.forEach((plugin) => {
                if (!_.find(plugins, x => x.name === plugin.name)) {
                    pluginsToDelete.push(plugin);
                }
            });
        } else {
            // if @apiName is undefined then we search for root level plugins.
            // kong will return all configured plugins for all apis.
            // we will recognize root level plugin if the plugin does not have api_id property.
            getPluginsResponse.body.data.forEach((plugin) => {
                if (!plugin['api_id'] && !_.find(plugins, x => x.name === plugin.name)) {
                    pluginsToDelete.push(plugin);
                }
            });
        }

        offset = getPluginsResponse.body.offset;

        if (!offset) {
            done = true;
        }
    }

    return pluginsToDelete;
}

module
    .exports = KongAPI;
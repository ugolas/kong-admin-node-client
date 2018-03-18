let httpHelper = require('./http-helper'),
    _ = require('lodash'),
    logger = require('./logger');

class KongAPI {
    constructor(options) {
        if (!options.kong_config || !options.kong_config.kong_admin_api_url) {
            throw new Error('kong_config & kong_config.kong_admin_api_url is mandatory');
        }
        this.kong_config = options.kong_config;
        this.kongAdminUrl = this.kong_config.kong_admin_api_url;
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
            logger.error(err, 'Error during configuration creation');
            throw (err);
        }

        logger.info('Successfully completed configuration');
    }

    async createApis(apis) {
        logger.info(`Setting up apis, ${apis.length} in total`);
        for (let api of apis) {
            // Clone the API object to delete the plugins from the request body:
            let apiPlugins = api.plugins;
            delete api.plugins;

            logger.info(`Setting up api: ${api.name}, ${apis.indexOf(api) + 1} out of ${apis.length} apis`);

            // Check if exists
            let getResponse = await httpHelper.getAPI({
                url: this.kongAdminUrl,
                apiName: api.name
            });

            // If API exists
            if (getResponse.statusCode === 200) {
                logger.info(`api: ${api.name} already exists, updating it's configuration`);
                // Add Id to request so it will update the resource
                api = _.defaults(api, getResponse.body);
            }

            let response = await httpHelper.createAPI({
                url: this.kongAdminUrl,
                body: api
            });
            let apiId = response.body.id;
            logger.info(`Configuration for api: ${api.name} set up successfully: ${apiId}`);

            // Create plugins for API
            if (apiPlugins) {
                await this.createPlugins(apiPlugins, api.name);
            }
        }
    }

    async getAPIs(apis, options) {
        let getResponse = [];
        apis = Array.isArray(apis) ? apis : [];

        if (apis.length === 0) {
            // Get all configured API's
            let response = await httpHelper.getAPI({
                url: this.kongAdminUrl,
                queryParams: options && typeof options === 'object' && options.queryParams
            });

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


            let response = await httpHelper.getAPI({
                url: this.kongAdminUrl,
                apiName: api.name
            });

            if (response.statusCode === 200) {
                getResponse.push(response.body);
            }
        }

        return getResponse;
    }

    async removeAPIs(apis) {
        logger.info(`Removing apis from kong, ${apis.length} in total`);
        for (let api of apis) {
            logger.info(`Removing api: ${api.name}, ${apis.indexOf(api) + 1} out of ${apis.length} apis`);

            // Check if exists
            let removeResponse = await httpHelper.deleteAPI({
                url: this.kongAdminUrl,
                apiName: api.name
            });

            if (removeResponse.statusCode === 404) {
                logger.info(`API ${api.name} not found. Skipping it.`);
            }

            logger.info(`Configuration for api: ${api.name} was removed successfully`);
        }
    }

    async removePlugins(plugins, apiName) {
        logger.info(apiName ? `Removing plugins from kong api: ${apiName}. ${plugins.length} in total` : `Removing plugins from kong in root api. ${plugins.length} in total`);
        for (let i = 0; i < plugins.length; i++) {
            let plugin = plugins[i];
            logger.info(`Removing plugin: ${plugin.name}, ${plugins.indexOf(plugin) + 1} out of ${plugins.length} plugins`);

            let removeResponse = await httpHelper.deletePlugin({
                url: this.kongAdminUrl,
                apiName: apiName,
                pluginId: plugin.id
            });

            if (removeResponse.statusCode === 404) {
                logger.info(`API ${plugin.name} not found. Skipping it.`);
            }

            logger.info(apiName ? `Removing plugin for api: ${apiName} was finished successfully. plugin name: ${plugin.name}` : `Removing plugin for root api was finished successfully. plugin name: ${plugin.name}`);
        }
    }

    async createPlugins(plugins, apiName) {
        logger.info(apiName ? `Setting up plugins in api: ${apiName}, ${plugins.length} in total` : `Setting up plugins, ${plugins.length} in total`);

        let pluginsToDelete = await getPluginsToDelete(this.kongAdminUrl, plugins, apiName);

        // Create or update plugins
        for (let plugin of plugins) {
            logger.info(apiName ? `Setting up plugin: ${plugin.name} in api: ${apiName}, ${plugins.indexOf(plugin) + 1} out of ${plugins.length} plugins` : `Setting up plugin: ${plugin.name}, ${plugins.indexOf(plugin) + 1} out of ${plugins.length}  plugins`);

            // Try finding existing plugin
            let getPluginsResponse = await httpHelper.getPlugins({
                url: this.kongAdminUrl,
                apiId: apiName,
                pluginName: plugin.name
            });

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

            let response = await httpHelper.createPlugin({
                url: this.kongAdminUrl,
                apiId: apiName,
                body: plugin
            });

            logger.info(`Configuration for plugin: ${plugin.name} set up successfully: ${response.body.id}`);
        }

        // delete plugins
        if (pluginsToDelete.length > 0) {
            await this.removePlugins(pluginsToDelete, apiName);
        }
    }

    async getPluginsOfExistApi(apiName) {
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

async function getPluginsToDelete(kongAdminUrl, plugins, apiName) {
    let pluginsToDelete = [];

    let offset = undefined;
    let done = false;

    // browse through the plugins list using pagination.
    //  each page contains @size plugins. any plugin from kong that does not appear
    // in the new plugins list will be mark as deleted
    while (!done) {
        let getPluginsRequest = {
            url: kongAdminUrl,
            size: 100
        };

        if (apiName) getPluginsRequest.apiId = apiName;
        getPluginsRequest.offset = offset;

        let getPluginsResponse = await
            httpHelper.getPlugins(getPluginsRequest);

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
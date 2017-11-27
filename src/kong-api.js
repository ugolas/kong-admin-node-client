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
        try {
            // Create APIs
            await this.createApis(apis);

            // Config root plugins:
            await this.createPlugins(this.kong_config.root_plugins);
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
            })

            // If API exists
            if (getResponse.statusCode === 200) {
                logger.info(`api: ${api.name} already exists, updating it's configuration`);
                // Add Id to request so it will update the resource
                api = _.defaults(api, getResponse.body);
            }

            let response = await httpHelper.createAPI({
                url: this.kongAdminUrl,
                body: api
            })
            let apiId = response.body.id;
            logger.info(`Configuration for api: ${api.name} set up successfully: ${apiId}`);

            // Create plugins for API
            if (apiPlugins) {
                await this.createPlugins(apiPlugins, api.name, apiId);
            }
        }
    }

    async createPlugins(plugins, apiName) {
        logger.info(apiName ? `Setting up plugins in api: ${apiName}, ${plugins.length} in total` : `Setting up plugins, ${plugins.length} in total`);
        // Check if exists
        let getPluginsResponse = await httpHelper.getPlugins({
            url: this.kongAdminUrl,
            apiName: apiName
        })

        let existingPlugins = getPluginsResponse.body.data;

        // Config plugins
        for (let plugin of plugins) {
            logger.info(apiName ? `Setting up plugin: ${plugin.name} in api: ${apiName}, ${plugins.indexOf(plugin) + 1} out of ${plugins.length} plugins` : `Setting up plugin: ${plugin.name}, ${plugins.indexOf(plugin) + 1} out of ${plugins.length}  plugins`);
            // Add Id to request so it will update the resource
            if (existingPlugins.length > 0) {
                let existingPlugin = _.find(existingPlugins, function (element) {
                    return element.name === plugin.name;
                });

                // If plugin exists
                if (existingPlugin) {
                    logger.info(apiName ? `Plugin: ${plugin.name} in api: ${apiName}' already exists, updating it's configuration` : `Plugin: ${plugin.name} already exists, updating it's configuration`);
                    plugin = _.defaults(plugin, existingPlugin);
                }
            }

            let response = await httpHelper.createPlugin({
                url: this.kongAdminUrl,
                apiId: apiName,
                body: plugin
            });

            logger.info(`Configuration for plugin: ${plugin.name} set up successfully: ${response.body.id}`)
        }
    }
}

module.exports = KongAPI;
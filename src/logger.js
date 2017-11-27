'use strict';
var bunyan = require('bunyan'),
    pkginfo = require('pkginfo')(module, 'version'),
    APP_VERSION = module.exports.version,
    logger = bunyan.createLogger({
        src: process.env.ENVIRONMENT === 'test',
        name: 'kong-admin-node-client',
        level: process.env.LOG_LEVEL || 'info',
        envrionment: process.env.ENVIRONMENT || 'test',
        version: APP_VERSION,
        serializers: {
            err: bunyan.stdSerializers.err
        }
    });


module.exports = logger;
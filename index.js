let kongAPI = require('./src/kong-api'),
    logger = require('./src/logger');

module.exports = kongAPI;

process.on('unhandledRejection', (err) => {
    logger.error(err);
})
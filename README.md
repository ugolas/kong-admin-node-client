[![NPM Version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]
[![Test Coverage][coveralls-image]][coveralls-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![MIT License][license-image]][license-url]

# kong admin client API
Client API for configuring Kong admin.

## Supported features
- Adding APIs
- Adding Plugins per API
- Adding plugins in root (for all APIs)
- Send accountId in request accountId (the function KongApi.setXZoozAccountId('*'))

## Road map
- Implementing all Kong Admin APIs
- Adding UT coverage

## Installation
This is a [Node.js](https://nodejs.org/en/) module available through the
[npm registry](https://www.npmjs.com/). Installation is done using the
[`npm install` command](https://docs.npmjs.com/getting-started/installing-npm-packages-locally):

```sh
$ npm install kong-admin-client --save
```

## Usage
```js
let KongAPI = require('kong-admin-node-client');

let kongAPI = new KongAPI({
    kong_config: {
        "kong_admin_api_url": "http://mky-kong:8001",
        "apis": [{
            "name": "myApp",
            "uris": "/path/",
            "upstream_url": "http://my-upstream-url.com",
            "plugins": [{
                "name": "rate-limiting",
                "config": {
                    "second": "5",
                    "hour": "10000"
                }
            }]
        }],
        "root_plugins": [{
            "name": "request-termination",
            "config": {
                "status_code": 403,
                "message": "So long and thanks for all the fish!"
            }
        }]
    },
    session_token : 'sessionToken', // not mandatory
    account_id: '*' // not mandatory 
});


kongAPI.createConfigurations()
    .then((result) => {
        // Success
    })
    .catch((err) => {
        // Failure
    });


```
[npm-image]: https://img.shields.io/npm/v/express-requests-logger.svg?style=flat
[npm-url]: https://www.npmjs.com/package/kong-admin-node-client
[travis-image]: https://travis-ci.org/ugolas/kong-admin-node-client.svg?branch=master
[travis-url]: https://travis-ci.org/ugolas/kong-admin-node-client
[coveralls-image]: https://coveralls.io/repos/github/ugolas/kong-admin-node-client/badge.svg?branch=master
[coveralls-url]: https://coveralls.io/github/ugolas/kong-admin-node-client?branch=master
[downloads-image]: http://img.shields.io/npm/dm/kong-admin-node-client.svg?style=flat
[downloads-url]: https://npmjs.org/package/kong-admin-node-client
[license-image]: http://img.shields.io/badge/license-MIT-blue.svg?style=flat
[license-url]: LICENSE
# kong admin client API
Client API for configuring Kong admin.

## Supported features
- Adding APIs
- Adding Plugins per API
- Adding plugins in root (for all APIs)

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
    }
});


kongAPI.createConfigurations()
    .then((result) => {
        // Success
    })
    .catch((err) => {
        // Failure
    });

```

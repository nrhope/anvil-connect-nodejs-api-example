var express = require('express')
  , anvil = require('anvil-connect-sdk')
  , server = express()
  ;


anvil.configure({
  provider: {
    uri:    'http://localhost:3000'

    // key: deprecated in anvil-connect-nodejs v0.1.10, as retrieved from anvil-connect's /jwks endpoint
  },
  client: {
    id:     'b5b31f48-5316-426e-8a6f-84b381d5b7c0',
    token:  'a59381e9d01262457ad7'
  },
  params: {
    redirectUri: 'http://yarris.anvil.ngrok.com/auth/oidc/callback'
  },
  extra_params: ['openid']
});

// force auth to be performed against anvil-connect provider

server.get('/authorize/openid/callback', anvil.authorize_proxy({ provider: 'openid' }));

server.get('/authorize/openid', anvil.authorize({ provider: 'openid' }));
//server.get('/authorize/openid', anvil.authorize({ extra_params: ['openid'] }));
server.get('/authorize', anvil.authorize({ }));
// node-http-proxy maybe?

// ensure redirectUri is called when token is present
server.get('/authorize/oidc/callback', function (req, res, next) {
  anvil.callback(req.url, function (err, authorization) {
    var retObj = {};
    if (err)
      retObj = { "error": err };
    else
      retObj =
      {
          "authorization.id_claims.iss": authorization.id_claims.iss,
          "authorization.id_claims.sub": authorization.id_claims.sub,
          "authorization.id_claims.aud": authorization.id_claims.aud,
          "authorization.id_claims.exp": authorization.id_claims.exp,
          "authorization.id_claims.iat": authorization.id_claims.iat,
          "SEP": "**********************",
          "authorization.access_token": authorization.access_token,
          "authorization.id_token": authorization.id_token,
          "authorization.refresh_token": authorization.refresh_token,
          "authorization.expires_in": authorization.expires_in
        };
    res.send("<pre>" + JSON.stringify(retObj, null, '\t') + "</pre>");
  });
});


/**
 * Protect the entire server
 */

server.get('/', function (req, res, next) {
  res.send('public');
});

/**
 * Or protect specific routes. Without options, the middleware
 * will require a valid access token in the request, per RFC6750.
 */

server.get('/widgets', anvil.verify(), function (req, res, next) {
  res.json(['x','y','z']);
});


/**
 * You can also require an access token to have a specific scope.
 */

var authorize = anvil.verify({
  scope: '' // 'sprocket.read'
});

server.get('/sprockets', authorize, function (req, res, next) {
  res.json(['a','b','c']);
});


/**
 * Start the server
 */

server.listen(5000, function () {
  console.log('API protected by Anvil Connect on port 5000');
});

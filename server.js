var express     = require('express')
  , anvil       = require('anvil-connect-sdk')
  , cwd         = process.cwd()
  , path        = require('path')
  , config      = require(path.join(cwd, 'config.json'))
  , server      = express()
  ;


anvil.configure(config);

// force auth to be performed against anvil-connect provider
server.get('/authorize/openid', anvil.authorize_proxy({ provider: 'openid' }));
server.get('/authorize/openid/callback', anvil.authorize_proxy({ provider: 'openid' }));

//server.get('/authorize/openid', anvil.authorize({ extra_params: ['openid'] }));
server.get('/authorize', anvil.authorize({ }));

server.get('/signout', anvil.signout({ }));

// node-http-proxy maybe?

// ensure redirectUri is called when token is present
server.get('/authorize/oidc/callback', function (req, res, next) {
  anvil.callback(req.url, function (err, authorization) {
    var authInfo = {};
    if (err) {
      authInfo = { "error": err };
      res.send("<pre>authInfo=" + JSON.stringify(authInfo, null, '\t') + "</pre>");
    }
    else {
      authInfo =
      {
        "authorization.id_claims.iss": authorization.id_claims.iss,
        "authorization.id_claims.sub": authorization.id_claims.sub,
        "authorization.id_claims.aud": authorization.id_claims.aud,
        "authorization.id_claims.exp": authorization.id_claims.exp,
        "authorization.id_claims.iat": authorization.id_claims.iat,
        "authorization.access_token": authorization.access_token,
        "authorization.id_token": authorization.id_token,
        "authorization.refresh_token": authorization.refresh_token,
        "authorization.expires_in": authorization.expires_in
      };
      anvil.userInfo(authorization.access_token, function (err, userInfo) {
        var   respPage;

        if (err)
          respPage = "authInfo=" + JSON.stringify(authInfo, null, '\t')
            + ", Error: " + JSON.stringify(err, null, '\t');
        else
          respPage = "authInfo=" + JSON.stringify(authInfo, null, '\t')
            + ", userInfo=" + JSON.stringify(userInfo, null, '\t');
        //res.send("<pre>" + respPage + "</pre><br><a href='/signout?code=" + req.query.code + "'>Signout</a>");
        res.send("<pre>" + respPage + "</pre><br><a href='/signout'>Signout</a>");
      });
    }
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


/**
 * Module dependencies.
 */

var express = require('express')
  , fs = require('fs')
  , all = fs.readFileSync(__dirname + '/components.json')
  , redis = require('redis')
  , db = redis.createClient()
  , app = module.exports = express();

// middleware

app.use(express.logger());
app.use(express.responseTime());

/**
 * Parse words.
 */

function words(str) {
  return str.match(/\w+/);
}

/**
 * Word keys from `words`.
 */

function wordKeys(words) {
  return words.map(function(str){
    return 'word:' + str;
  });
}

/**
 * Component keys from `names`.
 */

function componentKeys(names) {
  return names.map(function(str){
    return 'component:' + str;
  });
}

/**
 * Parse pkg json strings.
 */

function parse(pkgs) {
  return pkgs.map(JSON.parse);
}

/**
 * Respond with packages.
 */

function reply(res) {
  return function reply(err, keys) {
    if (err) return res.send(500);
    if (!keys.length) return res.send(404, []);

    db.mget(componentKeys(keys), function(err, pkgs){
      if (err) return res.send(500);
      res.send(parse(pkgs));
    });
  }
}

/**
 * GET all packages.
 */

app.get('/all', function(req, res){
  db.incr('stats:all');
  res.type('json');
  res.send(all);
});

/**
 * GET search :query.
 */

app.get('/search/:query', function(req, res){
  var query = words(req.params.query);

  // query stats
  db.incr('stats:queries');

  // word stats
  query.forEach(function(word){
    db.incr('stats:word:' + word);
  })

  // perform search
  query = wordKeys(query);
  db.sunion(query, reply(res));
});
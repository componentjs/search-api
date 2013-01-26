
/**
 * Module dependencies.
 */

var express = require('express')
  , fs = require('fs')
  , all = fs.readFileSync(__dirname + '/components.json')
  , redis = require('redis')
  , db = redis.createClient()
  , app = module.exports = express()
  , ms = require('ms')
  , util = require('./util');

// middleware

app.use(express.logger());
app.use(express.responseTime());
app.use(express.compress());

/**
 * Respond with packages.
 */

function reply(res) {
  return function reply(err, keys) {
    if (err) return res.send(500);
    if (!keys.length) return res.send(404, []);

    db.mget(util.componentKeys(keys), function(err, pkgs){
      if (err) return res.send(500);
      res.send(parse(pkgs));
    });
  }
}

/*
 * CORS support.
 */

app.all('*', function(req, res, next){
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET');
  res.set('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type');
  if ('OPTIONS' == req.method) return res.send(200);
  next();
});

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
  var query = util.words(req.params.query);

  // query stats
  db.incr('stats:queries');

  // word stats
  query.forEach(function(word){
    db.incr('stats:word:' + word);
  })

  // perform search
  query = util.wordKeys(query);
  db.sunion(query, reply(res));
});

/**
 * Update all.
 */

setInterval(function(){
  fs.readFile(__dirname + '/components.json', function(err, buf){
    if (err) return console.log(err.stack);
    console.log('updated all');
    all = buf;
  });
}, ms('5m'));

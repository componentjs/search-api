/**
 * Module dependencies.
 */

var wiki = require('component-wiki')
  , request = require('superagent')
  , redis = require('redis')
  , db = redis.createClient()
  , util = require('./util')
  , fs = require('fs');

// NOTE: quick / horrid code lives here ;D

var pending = 0;
var packages;

removeSearchIndex();

function removeSearchIndex(){
  db.keys('word*', function(err, ids){
    if (err) throw err;
    if (!ids.length) return removeComponents();
    console.log('removing %d indexes', ids.length);
    db.del(ids, function(err){
      if (err) throw err;
      console.log('index removed')
      removeComponents();
    });
  });
}

function removeComponents(){
  db.keys('component*', function(err, ids){
    if (err) throw err;
    if (!ids.length) return fetch();
    console.log('removing %d components', ids.length);
    db.del(ids, function(err){
      if (err) throw err;
      console.log('removed components');
      fetch();
    });
  });
}

var auth = fs.readFileSync(process.env.HOME + '/.component-search-auth', 'ascii');
auth = new Buffer(auth.trim()).toString('base64');

function fetch() {
  var batch = wiki(function(err, pkgs){
    if (err) throw err;
    packages = pkgs;

    pkgs.forEach(function(pkg){
      if (!pkg) return;
      console.log('%s', pkg.name);

      var words = util.words(pkg.name);
      if (!pkg.description) console.log('"description" missing for %s', pkg.name);
      else words = words.concat(util.words(pkg.description));
      words = words.concat(pkg.keywords || []);

      pkg.dependents = util.dependents(pkg, pkgs);
      pkg.stars = 0;

      ++pending;
      request
      .get('https://api.github.com/repos/' + pkg.repo)
      .set('Authorization', 'Basic ' + auth)
      .end(function(res){
        done();

        if (res.ok) {
          pkg.stars = res.body.watchers_count;
          console.log('%s stars: %d', pkg.repo, pkg.stars);
        } else {
          console.log('github: %s %s', res.status, res.text);
        }

        ++pending;
        db.set('component:' + pkg.repo, JSON.stringify(pkg), done);
      })

      ++pending;
      db.sadd('components', pkg.repo, done);

      words.forEach(function(word){
        ++pending;
        db.sadd('word:' + word, pkg.repo, done);
      });
    });
  });

  batch.on('error', function(err){
    if (err.json) {
      console.error('invalid json: %s', err.url);
    } else {
      console.error(err.stack);
    }
  });
}

function done() {
  --pending || (function(){
    fs.writeFileSync(__dirname + '/components.json', JSON.stringify(packages));
    process.exit();
  })();
}


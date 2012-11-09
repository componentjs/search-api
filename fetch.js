/**
 * Module dependencies.
 */

var wiki = require('component-wiki')
  , request = require('superagent')
  , redis = require('redis')
  , db = redis.createClient()
  , fs = require('fs');

// NOTE: quick / horrid code lives here ;D

var pending = 0;
var packages;

fetch();

var auth = fs.readFileSync(process.env.HOME + '/.component-search-auth', 'ascii');
auth = new Buffer(auth.trim()).toString('base64');

function fetch() {
  var batch = wiki(function(err, pkgs){
    if (err) throw err;
    packages = pkgs;

    pkgs.forEach(function(pkg){
      if (!pkg) return;
      console.log('%s', pkg.name);
      var words = [pkg.name];
      if (!pkg.description) console.log('"description" missing for %s', pkg.name);
      words = words.concat(parse(pkg.description));
      words = words.concat(pkg.keywords || []);
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

function parse(str) {
  str = String(str).trim();
  if (!str) return [];
  return str.match(/\w+/).map(function(word){
    return word.toLowerCase();
  });
}

function done() {
  --pending || (function(){
    fs.writeFileSync(__dirname + '/components.json', JSON.stringify(packages));
    process.exit();
  })();
}
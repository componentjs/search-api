
/**
 * Module dependencies.
 */

var wiki = require('component-wiki')
  , redis = require('redis')
  , db = redis.createClient()
  , fs = require('fs');

var pending = 0;

db.flushdb();

wiki(function(err, pkgs){
  if (err) throw err;

  fs.writeFileSync('components.json', JSON.stringify(pkgs));

  pkgs.forEach(function(pkg){
    if (!pkg) return;
    console.log();
    console.log('%s:', pkg.name);
    var words = [pkg.name];
    words = words.concat(parse(pkg.description));
    words = words.concat(pkg.keywords || []);

    ++pending;
    db.set('component:' + pkg.repo, JSON.stringify(pkg), done);

    ++pending;
    db.sadd('components', pkg.repo, done);

    words.forEach(function(word){
      console.log('  %s', word);
      ++pending;
      db.sadd('word:' + word, pkg.repo, done);
    });
  });
})

function parse(str) {
  return str.match(/\w+/).map(function(word){
    return word.toLowerCase();
  });
}

function done() {
  --pending || process.exit();
}
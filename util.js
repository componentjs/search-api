
/**
 * Parse words.
 * @param str {String}
 * @return {Array} Words.
 */

exports.words = function(str) {
  str = String(str).trim();
  if (!str) return [];
  return str.match(/\w+/).map(function(word){
    return word.toLowerCase();
  });
};

/**
 * Word keys from `words`.
 * @param words {Array}
 * @return {Array} Word keys.
 */

exports.wordKeys = function(words) {
  return words.map(function(str){
    return 'word:' + str;
  });
};

/**
 * Component keys from `names`.
 * @param names {Array}
 * @return {Array} Component keys.
 */

exports.componentKeys = function(names) {
  return names.map(function(str){
    return 'component:' + str;
  });
};

/**
 * List packages that depend on the supplied package, `pkg`.
 *
 * @param pkg
 * @param pkgs {Array} All packages to analyse.
 * @return {Array} Repos of packages that depend on `pkg`.
 */

exports.dependents = function(pkg, pkgs) {
  var repo = pkg.repo
  return pkgs.filter(blank).filter(function(pkg) {
    pkg.dependencies = pkg.dependencies || []
    return Object.keys(pkg.dependencies).indexOf(repo) !== -1
  }).map(function(pkg) {
    return pkg.repo
  })
}

/**
 * Check, if `pkg` is blank.
 *
 * @param pkg
 * @return {Boolean}
 */

function blank(pkg) {
  return !!pkg
}

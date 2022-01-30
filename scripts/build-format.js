const ejs = require('ejs');
const exec = require('child-process-promise').exec;
const fs = require('fs');
const pkg = require('../package.json');
const shell = require('shelljs');
const CleanCSS = require('clean-css');
const formatSettings = require("../src/formatSettings");

const encoding = { encoding: 'utf8' };

/**
 * Read through the 'src' and combine and process CSS files
 *
 * @function buildCSS
 * @returns {object} Returns a minified CleanCss object
 */
function buildCSS () {
  shell.rm('-f', 'src/format.css');
  shell.cat('src/css/normalize.css', 'src/css/vanilja.css').to('src/format.css');
  const file = fs.readFileSync('src/format.css');
  const output = new CleanCSS({ level: 2 }).minify(file);
  shell.rm('-f', 'src/format.css');
  return output.styles;
}

Promise.all([
  buildCSS(),
  exec('browserify -g uglifyify src/index.js -t [ babelify --presets [ @babel/env ] ]', { maxBuffer: Infinity })
]).then(function (results) {
  const distPath = 'dist/' + pkg.name.toLowerCase() + '-' + pkg.version;
  const htmlTemplate = ejs.compile(fs.readFileSync('src/index.ejs', encoding));
  let formatData = {...formatSettings};
  formatData.source = htmlTemplate({
    style: results[0],
    script: results[1].stdout
  });

  shell.mkdir('-p', distPath);

  fs.writeFileSync(
    distPath + '/format.js',
    'window.storyFormat(' + JSON.stringify(formatData) + ');'
  );

  shell.cp('src/icon.svg', distPath + '/icon.svg');
});

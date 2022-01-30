const pkg = require('../package.json');

const formatSettings = {
  author: pkg.author.replace(/ <.*>/, ''),
  description: pkg.description,
  image: 'icon.svg',
  name: pkg.name,
  proofing: false,
  url: pkg.repository,
  version: pkg.version
}

module.exports = formatSettings;
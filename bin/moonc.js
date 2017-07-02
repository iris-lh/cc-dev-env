const execa = require('execa');

function moonc(moon) {
  return execa.shellSync(`echo ${moon} | moonc --`).stdout
}

module.exports = moonc

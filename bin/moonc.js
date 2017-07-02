const execa = require('execa');

function moonc(moon) {
  return execa.shellSync(`echo ${moon} | ${__dirname}/moonc --`).stdout
}

module.exports = moonc

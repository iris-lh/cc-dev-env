const execa = require('execa');

function moonc(moon) {
  // original moonc should live in the directory with this wrapper
  return execa.shellSync(`echo "${moon}" | moonc --`).stdout
}

module.exports = moonc

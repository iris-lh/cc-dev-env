const jetpack     = require('fs-jetpack')
const projectRoot = jetpack.cwd()
const execa       = require('execa')
const _           = require('lodash')
const config      = require(`${projectRoot}/lua-config.json`)

const srcPath = `${projectRoot}/src/`


function moonc(moon) {
  return execa.shellSync(`echo "${moon}" | moonc --`).stdout
}


function loadLuas(srcPath) {
  const fileNames = jetpack.list(srcPath)
  var luas = {}

  for (var i = 0; i < fileNames.length; i++) {
    const fileName = fileNames[i]
    const fileToken = fileName.replace(/\.[a-z]*/, '')
    const isMoon = fileName.includes('.moon')
    const fileContents = isMoon 
      ? moonc(jetpack.read(`${srcPath}/${fileNames[i]}`))
      : jetpack.read(`${srcPath}/${fileNames[i]}`)
    luas[fileToken] = {
      name: fileToken,
      lines: fileContents.split('\n')
    }
  }

  return luas
}


function buildDependencyTree(luas) {
  var dependencyTree = {}
  _.forOwn(luas, (lua, key) => {
    dependencyTree[lua.name] = {name: lua.name, dependencies: []}
    return lua.lines.forEach( line => {
      const search = line.match(/['][a-z]*[']/)
      if (search) {
        const dependency = search[0].replace(/'/g, '')
        if (!dependencyTree[lua.name]) {
          dependencyTree[lua.name] = {name: lua.name, dependencies: []}
        }
        return dependencyTree[lua.name].dependencies.push(dependency)
      }
    })})
  const entrypointToken = config.entrypoint.match(/([a-z]+(?=\.))/)[0]
  dependencyTree.entrypoint = entrypointToken
  return dependencyTree
}


function resolve(tree, module, resolved = [], unresolved = []) {
  if (!module) {
    module = tree[tree.entrypoint]
  }
  unresolved.push(module.name)
  for (var i = 0; i < module.dependencies.length; i++) {
    const dependency = module.dependencies[i]
    if (!resolved.includes(dependency)) {
      if (unresolved.includes(dependency)) {
        throw new Error(`Circular reference detected: '${module.name}' is requiring '${dependency}'`)
      }
      resolve(tree, tree[dependency], resolved, unresolved)
    }
  }
  resolved.push(module.name)
  unresolved.splice( unresolved.indexOf(module.name), 1 )
  if (!unresolved.length) {
    return resolved
  }
}


function assembleLuas(luas, order) {
  function requirementsMet(line, lua) {
    return (
      !line.match('require') &&
      !(line === '') &&
      !line.match(new RegExp(('return\\s*' + lua.name), 'i'))
    )
  }

  var cleanLuas = []

  for (var i = 0; i < order.length; i++) {
    var cleanLua = []
    const lua = luas[order[i]]

    lua.lines.forEach(line => {
      if (requirementsMet(line, lua)) {
        cleanLua.push(line)
      }
    })

    cleanLuas.push(cleanLua.join('\n'))
  }
  return cleanLuas.join('\n\n')
}


function writeBundle(bundle) {
  jetpack.write(`${projectRoot}/build/${config.name}.lua`, bundle)
}


function luaBundle() {
  console.log(`bundling lua...`)
  const luas   = loadLuas(srcPath)
  const tree   = buildDependencyTree(luas)
  const order  = resolve(tree)
  const bundle = assembleLuas(luas, order)
  writeBundle(bundle)
  console.log('done.')
}

if (process.argv[2] === 'cli') {
  luaBundle()
}

module.exports = luaBundle
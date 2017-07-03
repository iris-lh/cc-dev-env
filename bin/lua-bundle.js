const jetpack     = require('fs-jetpack')
const projectRoot = jetpack.cwd()
const execa       = require('execa')
const _           = require('lodash')
const config      = require(`${projectRoot}/lua-config.json`)

const srcPath = `${projectRoot}/src/`


function moonc(moon) {
  return execa.shellSync(`echo "${moon}" | moonc --`).stdout
}


function tokenize(path) {
  return path.replace(/\.[a-z]*/, '')
}

function trimExtension(path) {
  return path.replace(/\..*/, '')
}


function loadLuas(srcPath) {
  const paths = jetpack.find(srcPath, {
    matching: ['./**/*.lua', './**/*.moon']
  }).map(path => {
    return path.replace(/.*?\//, '')
  })

  var luas = {}

  for (var i = 0; i < paths.length; i++) {
    const path = paths[i]
    const token = tokenize(path)
    const isMoon = path.includes('.moon')
    const contents = isMoon
      ? moonc(jetpack.read(`${srcPath}/${path}`))
      : jetpack.read(`${srcPath}/${path}`)
    luas[token] = {
      name: trimExtension(path),
      lines: contents.split('\n')
    }
  }

  return luas
}


function buildTree(luas) {
  var tree = {}
  _.forOwn(luas, (lua, key) => {
    tree[lua.name] = {name: lua.name, dependencies: []}
    const path = lua.name.replace(/(?!\/)([a-z]*)$/i, '')
    return lua.lines.forEach( line => {
      const requireLine = line.match(/= require/)
      if (requireLine) {
        const dependency = path + line
          .match(/('|")(.*)('|")/)[0] // isolate path
          .replace(/\.\//g, '') // trim './' from beginning
          .replace(/'|"/g, '') // remove quotes
        if (!tree[lua.name]) {
          tree[lua.name] = {name: lua.name, dependencies: []}
        }
        return tree[lua.name].dependencies.push(trimExtension(dependency))
      }
    })})
  const entrypointToken = tokenize(config.entrypoint)
    .replace(new RegExp('\..*\/', 'g'), '')
    .replace(/\..*/, '')
  tree.entrypoint = entrypointToken
  return tree
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
      !line.match(new RegExp(('return\\s*' + lua.name.replace(new RegExp('.*\/', 'g'), '')), 'i'))
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
  const tree   = buildTree(luas)
  const order  = resolve(tree)
  const bundle = assembleLuas(luas, order)
  writeBundle(bundle)
  console.log('done.')
}

if (process.argv[2] === 'cli') {
  luaBundle()
}

module.exports = luaBundle

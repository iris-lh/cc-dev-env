const jetpack     = require('fs-jetpack')
const projectRoot = jetpack.cwd()
const _           = require('lodash')
const config      = require(`${projectRoot}/lua-config.json`)
const moonc       = require('./moonc.js')

const srcPath = `${projectRoot}/src/`


const pipe = (arg, ...fns) => {
  const _pipe = (f, g) => {
    return (arg) => {
      return g(f(arg))
    }
  }
  return fns.reduce(_pipe)(arg)
}


function loadLuas(srcPath) {
  const fileNames = jetpack.list(srcPath)
  console.log(fileNames)
  var luas = {}

  for (var i = 0; i < fileNames.length; i++) {
    const fileName = fileNames[i]
    const fileToken = fileName.replace(/\.[a-z]*/, '')
    const isMoon = fileName.includes('.moon')
    console.log(fileToken, isMoon)
    const fileContents = isMoon 
      ? moonc(jetpack.read(`${srcPath}/${fileNames[i]}`))
      : jetpack.read(`${srcPath}/${fileNames[i]}`)
    luas[fileToken] = {
      name: fileToken,
      lines: fileContents.split('\n')
    }
  }

  console.log(luas)

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


function cleanupLua(lua) {
  function requirementsMet(line) {
    return (
      !line.match('require') &&
      !(line === '') &&
      !line.match(new RegExp('return\\s*' + lua.name))
    )
  }
  var cleanLua = []

  lua.lines.forEach(line => {
    if (requirementsMet(line)) {
      cleanLua.push(line)
    }
  })

  return cleanLua.join('\n')
}

function writeBundle(bundle) {
  jetpack.write(`${projectRoot}/build/${config.name}.lua`, bundle)
}


function luaBundle() {
  const luas = pipe(
    srcPath,
    loadLuas
    // buildDependencyTree
    // buildOrder
    // cleanupLuas
    // writeBundle
  )
  const tree = buildDependencyTree(luas)
  const buildOrder = resolve(tree)
  const cleanLuas = []
  for (var i = 0; i < buildOrder.length; i++) {
    const lua = luas[buildOrder[i]]
    cleanLuas.push(cleanupLua(lua))
  }
  const bundle = cleanLuas.join('\n\n')
  writeBundle(bundle)
}


luaBundle()

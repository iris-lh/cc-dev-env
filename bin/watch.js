const Watcher     = require('watch-fs').Watcher;
const jetpack     = require('fs-jetpack')
const projectRoot = jetpack.cwd()
const config      = require(`${projectRoot}/lua-config.json`)
const luaBundle = require('./lua-bundle')


const paths = config.watchPaths.map(path => {
    return projectRoot + '/' + path
})

const watcher = new Watcher({
    paths: paths,
    filters: {
        includeFile: function(name) {
            return /(\.lua)|(\.moon)/.test(name);
        }
    }
});
 
watcher.on('create', function(name) {
    console.log('file ' + name + ' created');
});
 
watcher.on('change', function(name) {
    console.log('file ' + name + ' changed, rebuilding');
    luaBundle()
});
 
watcher.on('delete', function(name) {
    console.log('file ' + name + ' deleted, rebuilding');
});
 
watcher.start(function(err, failed) {
    console.log(`watching paths: ${paths}`);
    if (failed.length) {
        console.log('files not found:', failed);
    }
    luaBundle()
});
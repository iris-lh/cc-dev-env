const paste       = require('better-pastebin');
const clipboardy  = require('clipboardy');
const jetpack     = require('fs-jetpack')
const projectRoot = jetpack.cwd()
const credentials = require(`${projectRoot}/pastebin-user.json`)
var   config      = require(`${projectRoot}/lua-config.json`)

const bundlePath = `${projectRoot}/build/${config.name}.lua`
const mode = process.argv[2]
const delayAfterLogin = 1000



function copyIdToClipboard() {
  const id = config.pastebinUrl.slice(
    config.pastebinUrl.length - 8,
    config.pastebinUrl.length
  )
  clipboardy.write(id)
  console.log(`pastebin id '${id}' copied to clipboard`);
}

function create() {
  paste.create({
    name: config.name,
    contents: jetpack.read(bundlePath),
    format: 'Lua',
    privacy: "1",
    expires: "10M"
  }, function(success, data) {
    if(success) {
      console.log('successfully pasted:', data)
      config.pastebinUrl = data
      jetpack.write(`${projectRoot}/lua-config.json`, config)
      copyIdToClipboard()
    } else {
      console.log(data);
    }
  });
}

function edit() {
  const id = config.pastebinUrl.slice(
    config.pastebinUrl.length - 8,
    config.pastebinUrl.length
  )
  paste.delete(id, function(success, data) {
    console.log(`deleted paste ${data}`)
  });
  create()
}


if (mode === 'copy') {
  copyIdToClipboard()
  process.exit()
}

paste.setDevKey(credentials.api_dev_key);

paste.login(credentials.api_user_name, credentials.api_user_password, function(success, data) {
  if(!success) {
    console.log("Failed (" + data + ")");
    return false;
  } else {
    // console.log(`session id: ${data}`)
  }

  // setting delay because better-pastebin login is wonky.
  // for some reason, if we don't wait,
  // better pastebin posts anonymously.
  setTimeout(()=>{
    switch (mode) {
      case 'update':
        edit()
        break;
      case 'copy':
        copyIdToClipboard()
        break;
    }
  }, delayAfterLogin)

});

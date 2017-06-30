const paste       = require("better-pastebin");
const jetpack     = require('fs-jetpack')
const projectRoot = jetpack.cwd()
const config      = require(`${projectRoot}/lua-config.json`)
const credentials = require(`${projectRoot}/pastebin-user.json`)

const bundlePath = `${projectRoot}/build/${config.name}.lua`


paste.setDevKey(credentials.api_dev_key);
paste.login(credentials.api_user_name, credentials.api_user_password, function(success, data) {
  if(!success) {
    console.log("Failed (" + data + ")");
    return false;
  } else {
    console.log(data)
  }

  // paste.create({
  //   name: "test paste3",
  //   contents: jetpack.read(bundlePath),
  //   format: 'Lua',
  //   privacy: "2"
  // }, function(success, data) {
  //   if(success) {
  //     console.log('successfully pasted:', data)
  //   } else {
  //     console.log(data);
  //   }
  // });

  // console.log(paste);

  // paste.user(function(success, data) {
  //   //data contains an array of objects of information about each paste
  //   console.log(data);
  // });

  const editOptions = {
    name: config.name,
    contents: jetpack.read(bundlePath),
    format: 'Lua',
    privacy: 2
  }

  paste.edit('YXA908wJ', editOptions, function(success, data) {
    console.log('success:', success, '\n')
    // console.log(data)
  });
});

local bop = require('./bop.lua')
local foo = require('./foo.lua')

local function baz()
  print('this is baz')
  bop()
  foo()
end

return baz

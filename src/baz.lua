local bop = require('bop')
local foo = require('foo')

local function baz()
  print('this is baz')
  bop()
  foo()
end

return baz

Deep = require './subdir/deep.moon'

class Shallow
	speak: =>
		Deep.speak!
		print 'this is Shallow'

return Shallow

Deeper = require './subdir/deeper.moon'

class Deep
	speak: =>
		Deeper.speak!
		print 'this is Deep'

return Deep

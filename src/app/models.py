from google.appengine.ext import ndb

class Dream( ndb.Model ):
	tags = ndb.StringProperty(repeated=True)

	def to_dict( self ):
		return { 'key' : self.key.urlsafe(),
		         'tags' : self.tags }

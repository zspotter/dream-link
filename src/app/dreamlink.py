import webapp2
import json
from cgi import escape

from models import *

"""
Handles dream submissions.
Redirects user to the dream they just submitted.
"""
class SubmitDream( webapp2.RequestHandler ):
	def post( self ):
		dream_tags = escape(self.request.get('dream_tags'))

		# Parse tags into separate words, removing empty strings
		dream_tags = filter(bool, dream_tags.split(','))

		# Ensure there are words!
		if len(dream_tags) == 0:
			self.redirect('/submit')
			return

		# Create the dream in the NDB
		dream = Dream(parent=ndb.Key('Dream', 'root'))
		dream.tags = dream_tags
		dream.put()

		dream_link = dream.key.urlsafe()

		# Redirect user to the dream browser with their dream at focus
		self.redirect('/dream/%s' % dream_link)


"""
Responds with a json structure of dreams keys connected to the requested link
"""
class DreamGraph( webapp2.RequestHandler ):
	def get( self ):
		dream_key = self.request.get('key', None)
		dream_tag = self.request.get('tag', None)

		# Check that dream or tag were provided
		if not dream_key and not dream_tag:
			self.abort(400)
			return

		shared_tags = None
		if dream_key:
			try:
				shared_tags = ndb.Key(urlsafe=dream_key).get().tags
			except Exception, e:
				# Catch bad urlsafe key. Unfortunately there is not a
				# single defined error that will be thrown for this...
				self.abort(400)
				return

		elif dream_tag:
			shared_tags = [dream_tag]

		# Query for up to 30 dreams with any of the same words
		dreams = Dream.query(Dream.tags.IN(shared_tags)).fetch(30)
		for i in range(len(dreams)):
			dreams[i] = dreams[i].to_dict()

		self.response.write(json.dumps( dreams ))


application = webapp2.WSGIApplication([
	('/app/submit', SubmitDream),
	('/app/dream', DreamGraph)
], debug=True)

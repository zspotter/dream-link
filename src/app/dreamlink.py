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
		url_key = self.request.get('key')
		dream_key = ndb.Key(urlsafe=url_key)

		dream_src = dream_key.get()

		# Check that dream_id refers to a valid dream
		if not dream_src:
			self.abort(400)
			return

		# Query for all dreams with any of the same words
		dreams = Dream.query(Dream.tags.IN(dream_src.tags)).fetch(30)
		for i in range(len(dreams)):
			dreams[i] = dreams[i].to_dict()

		self.response.write(json.dumps( dreams ))


application = webapp2.WSGIApplication([
	('/app/submit', SubmitDream),
	('/app/dream', DreamGraph)
], debug=True)

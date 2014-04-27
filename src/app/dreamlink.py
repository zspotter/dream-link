import webapp2
import json
from cgi import escape

"""
Handles dream submissions.
Redirects user to the dream they just submitted.
"""
class SubmitDream( webapp2.RequestHandler ):
	def post( self ):
		dream_tags = escape(self.request.get('dream_tags'))

		# Parse dream_tags and make a new dream entry

		dream_id = 'newdreamid'

		# Redirect user to the dream browser with their dream at focus
		self.redirect('/dream/%s' % dream_id)


"""
Responds with a json structure of dreams keys connected to the requested link
"""
class DreamGraph( webapp2.RequestHandler ):
	def post( self ):
		dream_id = self.request.get('link', None)

		# Check that dream_id refers to a valid dream
		if (dream_id == None):
			self.response.write(json.dumps({'error': 'bad dream id'}))
			return

		# Respond with a list of dreams and their words
		self.response.write(json.dumps([
			{dream_id: ['fluffy', 'puppy', 'unicorn']},
			{'other': ['fluffy', 'bear', 'teeth']},
			{'another': ['teeth', 'unicorn', 'hellfire']},
		]))


application = webapp2.WSGIApplication([
	('/app/submit', SubmitDream),
	('/app/dream', DreamGraph)
], debug=True)
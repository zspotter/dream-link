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

		# Create the dream and tags in the NDB
		dream = Dream(parent=ndb.Key('Dream', 'root'))
		dream.put()

		tag_keys = []
		for tag in dream_tags:
			tm = Tag.get_or_insert(tag.lower(), parent=ndb.Key('Tag', 'root'))
			if tm.dreams == None:
				tm.dreams = []
			tm.dreams.append(dream.key)
			tm.put()
			tag_keys.append(tm.key)

		# Connect graph
		dream.tags = tag_keys
		dream.put()

		# TODO optimize all previous put() calls

		dream_link = dream.key.urlsafe()

		# Redirect user to the dream browser with their dream at focus
		self.redirect('/dream/%s' % dream_link)


"""
Responds with a json structure of dreams keys connected to the requested link
"""
class DreamGraph( webapp2.RequestHandler ):
	def post( self ):
		dream_link = self.request.get('link')
		dream_key = ndb.Key(urlsafe=dream_link)

		dream = dream_key.get()

		# Check that dream_id refers to a valid dream
		if not dream:
			self.abort(400)
			return

		# Respond with a list of dreams and their words
		link_keys = [dream_key]
		dream_graph = [dream.to_dict()]
		for tag_key in dream.tags:
			for link_key in tag_key.get().dreams:
				if not link_key in link_keys:
					link_keys.append(link_key)
					dream_graph.append(link_key.get().to_dict())

		self.response.write(json.dumps( dream_graph ))


application = webapp2.WSGIApplication([
	('/app/submit', SubmitDream),
	('/app/dream', DreamGraph)
], debug=True)

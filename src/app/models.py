from google.appengine.ext import ndb

# Forward declaration
class Tag( ndb.Model ): pass

class Dream( ndb.Model ):
    tags = ndb.KeyProperty(kind=Tag, repeated=True)

    def to_dict( self ):
        words = []
        for tag_key in self.tags:
            words.append(tag_key.get().get_word())
        return { self.key.urlsafe() : words }


class Tag( ndb.Model ):
    dreams = ndb.KeyProperty(kind=Dream, repeated=True)

    def get_word( self ):
        return self.key.id()

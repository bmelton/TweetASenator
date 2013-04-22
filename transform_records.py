import re

from tweetasenator.models import *

def main():
    reps = Representative.objects.all()
    for rep in reps:
        try: 
            parts = re.findall(r'\[([^]]*)\]', rep.name)
            parts = str(parts)
            # I suck at regex, so after you're done laughing at this, fuck off!  /meanface.
            parts = parts.replace("\"", "")
            parts = parts.replace("\'", "")
            parts = parts.replace("[", "")
            parts = parts.replace("]", "")
            party, state = parts.split(",")
            party = party.replace("u", "")
            if party == "R":
                party = "Republican"
            if party == "D":
                party = "Democrat"
            if party == "I":
                party = "Independent"
            rep.party = party
            rep.save()
        except Exception, e:
            print "%s - %s" % (rep.name, str(e))


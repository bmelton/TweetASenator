import requests
import json

from tweetasenator.models import State, Representative

def main():
    print "Main invoked"
    states = State.objects.all()
    base_url = "http://api.opencongress.org/people.json?state="
    i = 0
    for state in states:
        i = i+1
        if i < 100:
            state_url = "%s%s" % (base_url, state.code)
            while True:
                try: 
                    data = get_data(state_url)
                    if not data.ok:
                        raise Exception("NOTOK")
                except Exception, e:
                    print "Exception: %s" % (str(e))
                    continue
                break

            jsondata = json.loads(data.text)
            people = jsondata["people"]
            for person in people:
                rep = Representative()
                rep.state       = state.code
                rep.firstname   = person["person"]["firstname"]
                rep.middlename  = person["person"]["middlename"]
                rep.lastname    = person["person"]["lastname"]
                rep.website     = person["person"]["website"]
                rep.email       = person["person"]["email"]
                rep.approval    = person["person"]["user_approval"]
                rep.contact     = person["person"]["contact_webform"]
                rep.dem_votes_percentage = person["person"]["votes_democratic_position"]
                rep.rep_votes_percentage = person["person"]["votes_republican_position"]
                rep.district    = person["person"]["district"]
                rep.url         = person["person"]["url"]
                rep.youtube     = person["person"]["youtube_id"]
                rep.gender      = person["person"]["gender"]
                rep.name        = person["person"]["name"]
                try:
                    rep.oc_id       = person["person"]["person_stats"]["person_id"]
                except Exception, e:
                    print "No person data exists for this representative"
                rep.save()
                print person["person"]["name"]

def get_data(url):
    print "Getting data for %s" % (url)
    data = requests.get(url)
    return data

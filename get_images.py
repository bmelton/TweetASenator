import requests
import json

from tweetasenator.models import State, Representative

def main():
    print "Main invoked"
    reps = Representative.objects.filter(pic__isnull=True)
    base_url = "http://opencongress.org/images/photos/thumbs_102"
    path     = "/home/bmelton/projects/tweetasenator/tweetasenator/static/photos/thumbs/"
    url      = "http://tweetasenator.com/static/photos/thumbs"
    for rep in reps:
        img_url = "%s/%d.png" % (base_url, rep.oc_id)
        r = requests.get(img_url)
        if r.ok:
            with open("%s/%d.png" % (path, rep.oc_id), 'wb') as f:
                for chunk in r:
                    f.write(chunk)
            rep.pic = "%s/%d.png" % (url, rep.oc_id)
            rep.save()
        print img_url

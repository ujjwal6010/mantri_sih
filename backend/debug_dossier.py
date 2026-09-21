import urllib.request, json

try:
    r = urllib.request.urlopen('http://127.0.0.1:8000/projects/MD001/dossier')
    print(json.loads(r.read()))
except Exception as e:
    if hasattr(e, 'read'):
        print("ERROR:", e.read().decode())
    else:
        print("ERROR:", str(e))

import urllib.request, json

# Test top 5 projects by risk
r = urllib.request.urlopen('http://127.0.0.1:8000/projects?limit=5')
d = json.loads(r.read())
print("=== TOP 5 PROJECTS BY RISK ===")
for p in d:
    sig = (p["main_signal"] or "No signal")[:80]
    print(f'{p["project_id"]} | Risk: {p["risk_score"]:5.1f} | Conf: {p["confidence_score"]:5.1f} | {sig}')

# Test fingerprint
print("\n=== FINGERPRINT: MD001 ===")
r = urllib.request.urlopen('http://127.0.0.1:8000/projects/MD001/fingerprint')
fp = json.loads(r.read())
for dim, data in fp.items():
    print(f"  {dim}: {data}")

# Test risk breakdown
print("\n=== RISK: MD001 ===")
r = urllib.request.urlopen('http://127.0.0.1:8000/projects/MD001/risk')
risk = json.loads(r.read())
print(f"  Risk: {risk['risk_score']}, Confidence: {risk['confidence_score']}")
print(f"  Breakdown: {risk['breakdown']}")
print(f"  Why Flagged:")
for reason in risk['why_flagged']:
    print(f"    - {reason}")

# Test dossier
print("\n=== DOSSIER: MD001 ===")
r = urllib.request.urlopen('http://127.0.0.1:8000/projects/MD001/dossier')
dos = json.loads(r.read())
print(f"  Risk: {dos['risk_score']}, Confidence: {dos['confidence_score']}")
print(f"  Why Flagged: {len(dos['why_flagged'])} reasons")
print(f"  Similar Projects: {len(dos['similar_projects'])}")
print(f"  Verification Steps: {len(dos['recommended_verification'])}")
print(f"  Disclaimer: {dos['disclaimer'][:60]}...")

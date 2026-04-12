import urllib.request
import json
import ssl

key = "AIzaSyDKjDYb6Q-UieIn6Fkb459JL5XKEcBC8xs"
model = "gemini-2.0-flash"
url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"

data = {
    "contents": [{
        "parts": [{"text": "Hello"}]
    }]
}

try:
    context = ssl._create_unverified_context()
    req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers={'Content-Type': 'application/json'})
    
    with urllib.request.urlopen(req, context=context) as response:
        result = json.loads(response.read().decode('utf-8'))
        print("SUCCESS: Generated content.")
        print(result.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', 'No text'))

except Exception as e:
    print(f"FAILED: {e}")
    # Print detailed error if possible (e is usually just HTTPError, need to read body)
    if hasattr(e, 'read'):
        print(e.read().decode('utf-8'))

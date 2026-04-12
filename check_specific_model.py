import urllib.request
import json
import ssl

key = "AIzaSyDtNSN_EhxioLmnwQBBtrG5nJwj5wUD05I"
url = f"https://generativelanguage.googleapis.com/v1beta/models?key={key}"

try:
    context = ssl._create_unverified_context()
    with urllib.request.urlopen(url, context=context) as response:
        data = json.loads(response.read().decode('utf-8'))
        
        found = False
        for model in data.get('models', []):
            if 'gemini-1.5-flash' in model['name']:
                print(f"FOUND: {model['name']}")
                found = True
        
        if not found:
            print("gemini-1.5-flash NOT FOUND")

except Exception as e:
    print(f"Error: {e}")

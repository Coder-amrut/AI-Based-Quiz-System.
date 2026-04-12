import urllib.request
import json
import ssl
import time

key = "AIzaSyDKjDYb6Q-UieIn6Fkb459JL5XKEcBC8xs"
candidates = [
    "gemini-2.0-flash-lite", 
    "gemini-flash-latest",
    "gemini-2.0-flash-exp",
    "gemini-2.0-flash-001"
]

data = {
    "contents": [{"parts": [{"text": "Hello"}]}]
}
context = ssl._create_unverified_context()

for model in candidates:
    print(f"Testing {model}...")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
    
    try:
        req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req, context=context) as response:
            result = json.loads(response.read().decode('utf-8'))
            print(f"SUCCESS with {model}!")
            # Save the working model name to a file for easy reading
            with open('working_model.txt', 'w') as f:
                f.write(model)
            break
    except Exception as e:
        print(f"FAILED {model}: {e}")
        time.sleep(1) 

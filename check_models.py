import urllib.request
import json
import ssl

key = "AIzaSyDKjDYb6Q-UieIn6Fkb459JL5XKEcBC8xs"
url = f"https://generativelanguage.googleapis.com/v1beta/models?key={key}"

try:
    context = ssl._create_unverified_context()
    with urllib.request.urlopen(url, context=context) as response:
        data = json.loads(response.read().decode('utf-8'))
        
        with open('available_models.txt', 'w', encoding='utf-8') as f:
            if 'models' in data:
                for model in data['models']:
                    if 'generateContent' in model.get('supportedGenerationMethods', []):
                        f.write(f"{model['name']}\n")
                        print(f"Written: {model['name']}")
            else:
                f.write("No models found or error in data structure.\n")
                f.write(str(data))

except Exception as e:
    print(f"Error: {e}")

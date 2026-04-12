import json

try:
    # Try utf-16 which handles BOM automatically
    with open('models.json', 'r', encoding='utf-16') as f:
        data = json.load(f)
        for model in data['models']:
            if 'generateContent' in model['supportedGenerationMethods']:
                print(model['name'])
except Exception as e:
    print(f"Error: {e}")

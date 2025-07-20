import base64
import argparse
import requests
import json

def upload_image(file):
    with open(file, 'rb') as f:
        image = f.read()
        im = base64.b64encode(image).decode("utf-8")
        a = requests.post('http://localhost:8080/vectors', data = json.dumps({'id':'test', 'image': im}))
        # print("result:" + str(a.json()))
    return a.json()['vector']

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--file', type=str, required=True)
    args = parser.parse_args()
    file = args.file
    vector = upload_image(file)
    print(vector)
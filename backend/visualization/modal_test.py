import requests
import modal

response = requests.get("http://localhost:8000/catalogue")
catalogue = response.json()

print(catalogue[0])
